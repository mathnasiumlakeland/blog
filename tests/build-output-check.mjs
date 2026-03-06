import { constants as fsConstants } from 'node:fs';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFile = fileURLToPath(import.meta.url);
const testsDir = path.dirname(currentFile);
const repoRoot = path.resolve(testsDir, '..');

const buildDir = path.join(repoRoot, 'build');
const buildIndexPath = path.join(buildDir, 'index.html');
const build404Path = path.join(buildDir, '404.html');
const toolsIndexPath = path.join(buildDir, 'tools', 'index.html');
const registryPath = path.join(repoRoot, 'src', 'lib', 'components', 'math', 'tool-registry.ts');

function parseRegistryIds(content) {
	const ids = [];
	const entryRegex = /\{\s*id:\s*'([^']+)'\s*,\s*meta:\s*\{\s*id:\s*'([^']+)'/gms;
	let match = entryRegex.exec(content);
	while (match) {
		if (match[1] !== match[2]) {
			throw new Error(`Registry id mismatch detected while parsing build check: ${match[1]} != ${match[2]}`);
		}
		ids.push(match[1]);
		match = entryRegex.exec(content);
	}
	return ids;
}

async function ensureExists(filePath, label) {
	try {
		await access(filePath, fsConstants.F_OK);
	} catch {
		throw new Error(`Missing ${label}: ${filePath}`);
	}
}

async function run() {
	await ensureExists(buildDir, 'build directory');
	await ensureExists(buildIndexPath, 'build index');
	await ensureExists(build404Path, 'custom 404 page');
	await ensureExists(toolsIndexPath, 'tools index');

	const [registryContent, buildIndex, build404, toolsIndex] = await Promise.all([
		readFile(registryPath, 'utf8'),
		readFile(buildIndexPath, 'utf8'),
		readFile(build404Path, 'utf8'),
		readFile(toolsIndexPath, 'utf8')
	]);

	if (!buildIndex.includes('vite:preloadError')) {
		throw new Error('Build index is missing the vite:preloadError recovery hook.');
	}

	if (!buildIndex.includes('Failed to fetch dynamically imported module')) {
		throw new Error('Build index is missing dynamic-import failure recovery text.');
	}

	if (!build404.includes('Page not found.')) {
		throw new Error('Custom 404 page is missing the expected not-found heading.');
	}

	const toolIds = parseRegistryIds(registryContent);
	if (toolIds.length === 0) {
		throw new Error('No tool ids found in registry while running build output check.');
	}

	for (const id of toolIds) {
		const toolPagePath = path.join(buildDir, 'tools', id, 'index.html');
		await ensureExists(toolPagePath, `tool page for ${id}`);

		if (!toolsIndex.includes(`/tools/${id}`)) {
			throw new Error(`Tools index does not include link to /tools/${id}`);
		}
	}

	console.log(`Build output checks passed for custom 404 output and ${toolIds.length} prerendered tool pages.`);
}

run().catch((error) => {
	console.error(error instanceof Error ? error.message : 'Build output checks failed.');
	process.exit(1);
});
