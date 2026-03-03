import { constants as fsConstants } from 'node:fs';
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFile = fileURLToPath(import.meta.url);
const testsDir = path.dirname(currentFile);
const repoRoot = path.resolve(testsDir, '..');
const artifactsDir = path.join(testsDir, '.artifacts');
const transientArtifactPath = path.join(artifactsDir, 'transient-smoke-artifact.txt');
const appHtmlPath = path.join(repoRoot, 'src', 'app.html');

const requiredRecoverySnippets = [
	'vite:preloadError',
	'Failed to fetch dynamically imported module'
];

async function exists(filePath) {
	try {
		await access(filePath, fsConstants.F_OK);
		return true;
	} catch {
		return false;
	}
}

async function run() {
	await rm(artifactsDir, { recursive: true, force: true });
	await mkdir(artifactsDir, { recursive: true });

	await writeFile(
		transientArtifactPath,
		'Transient artifact for prebuild smoke testing. This file should be deleted immediately.\n',
		'utf8'
	);

	if (!(await exists(transientArtifactPath))) {
		throw new Error('Smoke test failed: transient artifact was not created.');
	}

	await rm(transientArtifactPath, { force: true });

	if (await exists(transientArtifactPath)) {
		throw new Error('Smoke test failed: transient artifact was not removed.');
	}

	const appHtml = await readFile(appHtmlPath, 'utf8');
	for (const snippet of requiredRecoverySnippets) {
		if (!appHtml.includes(snippet)) {
			throw new Error(`Smoke test failed: expected snippet not found in app.html: ${snippet}`);
		}
	}

	await rm(artifactsDir, { recursive: true, force: true });
	console.log('Prebuild smoke checks passed.');
}

run().catch(async (error) => {
	await rm(artifactsDir, { recursive: true, force: true });
	console.error(error instanceof Error ? error.message : 'Prebuild smoke checks failed.');
	process.exit(1);
});
