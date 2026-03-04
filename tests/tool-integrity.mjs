import { constants as fsConstants } from 'node:fs';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFile = fileURLToPath(import.meta.url);
const testsDir = path.dirname(currentFile);
const repoRoot = path.resolve(testsDir, '..');

const registryPath = path.join(repoRoot, 'src', 'lib', 'components', 'math', 'tool-registry.ts');
const componentMapPath = path.join(
	repoRoot,
	'src',
	'lib',
	'components',
	'math',
	'tool-component-map.ts'
);
const practicePath = path.join(repoRoot, 'src', 'lib', 'components', 'math', 'tool-practice.ts');
const componentsDir = path.join(repoRoot, 'src', 'lib', 'components', 'math');
const PRACTICE_EXEMPT_TOOL_IDS = new Set([
	'scientific-calculator',
	'prime-factorization-factor-tree-lab'
]);

function parseRegistryEntries(content) {
	const entries = [];
	const entryRegex = /\{\s*id:\s*'([^']+)'\s*,\s*meta:\s*\{\s*id:\s*'([^']+)'/gms;
	let match = entryRegex.exec(content);
	while (match) {
		entries.push({ id: match[1], metaId: match[2] });
		match = entryRegex.exec(content);
	}
	return entries;
}

function parseSourceMapEntries(content) {
	const entries = new Map();
	const sourceRegex = /'([^']+)':\s*'([^']+\.svelte)'/g;
	let match = sourceRegex.exec(content);
	while (match) {
		entries.set(match[1], match[2]);
		match = sourceRegex.exec(content);
	}
	return entries;
}

function parseLoaderEntries(content) {
	const entries = new Map();
	const loaderRegex = /'([^']+)':\s*\(\)\s*=>\s*import\('\.\/([^']+\.svelte)'\)/gms;
	let match = loaderRegex.exec(content);
	while (match) {
		entries.set(match[1], match[2]);
		match = loaderRegex.exec(content);
	}
	return entries;
}

function parsePracticeKeys(content) {
	const keys = new Set();
	const keyRegex = /'([^']+)':\s*\(\)\s*=>\s*\{/g;
	let match = keyRegex.exec(content);
	while (match) {
		keys.add(match[1]);
		match = keyRegex.exec(content);
	}
	return keys;
}

async function fileExists(filePath) {
	try {
		await access(filePath, fsConstants.F_OK);
		return true;
	} catch {
		return false;
	}
}

function collectDuplicates(values) {
	const counts = new Map();
	for (const value of values) {
		counts.set(value, (counts.get(value) ?? 0) + 1);
	}
	return [...counts.entries()].filter(([, count]) => count > 1).map(([value]) => value);
}

async function run() {
	const [registryContent, componentMapContent, practiceContent] = await Promise.all([
		readFile(registryPath, 'utf8'),
		readFile(componentMapPath, 'utf8'),
		readFile(practicePath, 'utf8')
	]);

	const registryEntries = parseRegistryEntries(registryContent);
	if (registryEntries.length === 0) {
		throw new Error('No interactive tool entries found in tool-registry.ts');
	}

	const registryIds = registryEntries.map((entry) => entry.id);
	const duplicateRegistryIds = collectDuplicates(registryIds);
	if (duplicateRegistryIds.length > 0) {
		throw new Error(`Duplicate tool ids in tool-registry.ts: ${duplicateRegistryIds.join(', ')}`);
	}

	const metaIdMismatches = registryEntries.filter((entry) => entry.id !== entry.metaId);
	if (metaIdMismatches.length > 0) {
		const details = metaIdMismatches
			.map((mismatch) => `${mismatch.id} != ${mismatch.metaId}`)
			.join('; ');
		throw new Error(`Registry id/meta.id mismatch: ${details}`);
	}

	const sourceEntries = parseSourceMapEntries(componentMapContent);
	const loaderEntries = parseLoaderEntries(componentMapContent);
	const practiceKeys = parsePracticeKeys(practiceContent);

	const sourceIds = [...sourceEntries.keys()];
	const loaderIds = [...loaderEntries.keys()];
	const duplicateSourceIds = collectDuplicates(sourceIds);
	const duplicateLoaderIds = collectDuplicates(loaderIds);

	if (duplicateSourceIds.length > 0) {
		throw new Error(`Duplicate source map ids in tool-component-map.ts: ${duplicateSourceIds.join(', ')}`);
	}
	if (duplicateLoaderIds.length > 0) {
		throw new Error(`Duplicate loader ids in tool-component-map.ts: ${duplicateLoaderIds.join(', ')}`);
	}

	const registryIdSet = new Set(registryIds);
	const sourceIdSet = new Set(sourceIds);
	const loaderIdSet = new Set(loaderIds);

	const missingInSourceMap = registryIds.filter((id) => !sourceIdSet.has(id));
	if (missingInSourceMap.length > 0) {
		throw new Error(`Tool ids missing from component source map: ${missingInSourceMap.join(', ')}`);
	}

	const missingInLoaders = registryIds.filter((id) => !loaderIdSet.has(id));
	if (missingInLoaders.length > 0) {
		throw new Error(`Tool ids missing from component loaders: ${missingInLoaders.join(', ')}`);
	}

	const extraSourceIds = sourceIds.filter((id) => !registryIdSet.has(id));
	if (extraSourceIds.length > 0) {
		throw new Error(`Component source map ids not present in registry: ${extraSourceIds.join(', ')}`);
	}

	const extraLoaderIds = loaderIds.filter((id) => !registryIdSet.has(id));
	if (extraLoaderIds.length > 0) {
		throw new Error(`Component loader ids not present in registry: ${extraLoaderIds.join(', ')}`);
	}

	for (const id of registryIds) {
		const sourceFile = sourceEntries.get(id);
		const loaderFile = loaderEntries.get(id);

		if (!sourceFile || !loaderFile) {
			throw new Error(`Missing component map entry for id: ${id}`);
		}

		if (sourceFile !== loaderFile) {
			throw new Error(
				`Source/loader filename mismatch for id ${id}: source=${sourceFile}, loader=${loaderFile}`
			);
		}

		const componentPath = path.join(componentsDir, sourceFile);
		if (!(await fileExists(componentPath))) {
			throw new Error(`Component file missing for id ${id}: ${componentPath}`);
		}

		const componentContent = await readFile(componentPath, 'utf8');
		const toolMetaBindingMatch = componentContent.match(/requireInteractiveToolMetaById\('([^']+)'\)/);
		if (toolMetaBindingMatch && toolMetaBindingMatch[1] !== id) {
			throw new Error(
				`Component ${sourceFile} binds toolMeta id ${toolMetaBindingMatch[1]} but is mapped as ${id}`
			);
		}

		if (!PRACTICE_EXEMPT_TOOL_IDS.has(id) && !practiceKeys.has(id)) {
			throw new Error(`Missing practice generator entry for tool id: ${id}`);
		}
	}

	console.log(
		`Tool integrity checks passed for ${registryEntries.length} tools (registry/map/component/practice parity).`
	);
}

run().catch((error) => {
	console.error(error instanceof Error ? error.message : 'Tool integrity checks failed.');
	process.exit(1);
});
