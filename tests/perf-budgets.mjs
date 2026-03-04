import { constants as fsConstants } from 'node:fs';
import { access, readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFile = fileURLToPath(import.meta.url);
const testsDir = path.dirname(currentFile);
const repoRoot = path.resolve(testsDir, '..');
const postsDir = path.join(repoRoot, 'src', 'content', 'posts');
const generatedComponentMapPath = path.join(
	repoRoot,
	'src',
	'lib',
	'content',
	'post-components.generated.ts'
);
const buildDir = path.join(repoRoot, 'build');

const preloadBudgets = [
	{ route: '/', htmlPath: path.join(buildDir, 'index.html'), maxKiB: 900 },
	{ route: '/posts', htmlPath: path.join(buildDir, 'posts', 'index.html'), maxKiB: 900 },
	{
		route: '/posts/reflecting-points-across-a-line',
		htmlPath: path.join(buildDir, 'posts', 'reflecting-points-across-a-line', 'index.html'),
		maxKiB: 980
	}
];

function toSlug(filename) {
	return filename.replace(/\.md$/u, '');
}

function normalizeBoolean(rawValue) {
	const normalized = rawValue.trim().replace(/^['"]|['"]$/g, '').toLowerCase();
	if (normalized === 'true') return true;
	if (normalized === 'false') return false;
	return undefined;
}

function parseFrontmatter(source) {
	const frontmatterMatch = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
	if (!frontmatterMatch) {
		return '';
	}
	return frontmatterMatch[1];
}

async function fileExists(filePath) {
	try {
		await access(filePath, fsConstants.F_OK);
		return true;
	} catch {
		return false;
	}
}

async function getExpectedProdSlugs() {
	const files = (await readdir(postsDir)).filter((file) => file.endsWith('.md')).sort();
	const expectedSlugs = [];

	for (const filename of files) {
		const source = await readFile(path.join(postsDir, filename), 'utf8');
		const frontmatter = parseFrontmatter(source);
		const devOnlyMatch = frontmatter.match(/^\s*devOnly\s*:\s*([^\r\n#]+)/m);
		const devOnly = devOnlyMatch ? normalizeBoolean(devOnlyMatch[1]) : undefined;
		if (devOnly !== true) {
			expectedSlugs.push(toSlug(filename));
		}
	}

	return expectedSlugs;
}

function getGeneratedSlugs(generatedSource) {
	const slugsBlockMatch = generatedSource.match(
		/export const generatedPostComponentSlugs = \[([\s\S]*?)\] as const;/
	);
	if (!slugsBlockMatch) {
		throw new Error('generatedPostComponentSlugs export not found in post-components.generated.ts');
	}

	const slugMatches = [...slugsBlockMatch[1].matchAll(/'([^']+)'/g)];
	return slugMatches.map((match) => match[1]).sort();
}

function resolvePreloadPath(href, htmlPath) {
	let cleanHref = href.split('#')[0]?.split('?')[0] ?? href;
	if (/^(https?:)?\/\//.test(cleanHref)) {
		return null;
	}

	if (cleanHref.startsWith('/blog/')) {
		cleanHref = cleanHref.slice('/blog/'.length);
		return path.join(buildDir, cleanHref);
	}

	if (cleanHref.startsWith('/')) {
		cleanHref = cleanHref.slice(1);
		return path.join(buildDir, cleanHref);
	}

	return path.resolve(path.dirname(htmlPath), cleanHref);
}

function collectModulePreloadHrefs(html) {
	const links = html.match(/<link[^>]*rel=["']modulepreload["'][^>]*>/g) ?? [];
	return links
		.map((link) => link.match(/href=["']([^"']+)["']/)?.[1] ?? '')
		.filter((href) => href.length > 0);
}

async function getPreloadedJsBytes(htmlPath) {
	const html = await readFile(htmlPath, 'utf8');
	const hrefs = collectModulePreloadHrefs(html);
	const modulePaths = new Set();

	for (const href of hrefs) {
		const resolvedPath = resolvePreloadPath(href, htmlPath);
		if (!resolvedPath || !resolvedPath.endsWith('.js')) {
			continue;
		}
		modulePaths.add(resolvedPath);
	}

	let totalBytes = 0;
	for (const modulePath of modulePaths) {
		if (!(await fileExists(modulePath))) {
			throw new Error(`Preloaded module file not found: ${modulePath}`);
		}
		const moduleStats = await stat(modulePath);
		totalBytes += moduleStats.size;
	}

	return {
		totalBytes,
		moduleCount: modulePaths.size
	};
}

function formatKiB(bytes) {
	return (bytes / 1024).toFixed(1);
}

async function run() {
	if (!(await fileExists(generatedComponentMapPath))) {
		throw new Error(
			`Missing generated post component map at ${generatedComponentMapPath}. Run POST_COMPONENT_MAP_MODE=prod bun run generate:post-components first.`
		);
	}

	const [generatedSource, expectedSlugs] = await Promise.all([
		readFile(generatedComponentMapPath, 'utf8'),
		getExpectedProdSlugs()
	]);
	const generatedSlugs = getGeneratedSlugs(generatedSource);

	const expectedSorted = [...expectedSlugs].sort();
	const expectedKey = expectedSorted.join(',');
	const generatedKey = generatedSlugs.join(',');
	if (expectedKey !== generatedKey) {
		throw new Error(
			`Generated post component map mismatch.\nExpected: ${expectedSorted.join(', ')}\nFound: ${generatedSlugs.join(', ')}`
		);
	}

	const budgetResults = [];
	for (const budget of preloadBudgets) {
		if (!(await fileExists(budget.htmlPath))) {
			throw new Error(`Missing prerendered page for budget check: ${budget.htmlPath}`);
		}

		const { totalBytes, moduleCount } = await getPreloadedJsBytes(budget.htmlPath);
		const totalKiB = totalBytes / 1024;
		if (totalKiB > budget.maxKiB) {
			throw new Error(
				`${budget.route} preloads ${formatKiB(totalBytes)} KiB JS across ${moduleCount} modules (budget: ${budget.maxKiB} KiB).`
			);
		}

		budgetResults.push(
			`${budget.route}: ${formatKiB(totalBytes)} KiB JS across ${moduleCount} modules (budget ${budget.maxKiB} KiB)`
		);
	}

	console.log('Performance budgets passed:');
	for (const line of budgetResults) {
		console.log(`- ${line}`);
	}
}

run().catch((error) => {
	console.error(error instanceof Error ? error.message : 'Performance budget checks failed.');
	process.exit(1);
});
