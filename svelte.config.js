import adapter from '@sveltejs/adapter-static';
import { mdsvex } from 'mdsvex';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const basePath = (() => {
	const value = process.env.BASE_PATH?.trim() ?? '';
	if (!value || value === '/') return '';
	return value.endsWith('/') ? value.slice(0, -1) : value;
})();

const postComponentsMode =
	process.env.POST_COMPONENT_MAP_MODE?.trim() === 'prod' || process.argv.includes('build')
		? 'prod'
		: 'dev';

const postComponentsAliasTarget =
	postComponentsMode === 'prod'
		? './src/lib/content/post-components.prod.ts'
		: './src/lib/content/post-components.ts';

function remarkNormalizeMathCommands() {
	return (tree) => {
		function walk(node) {
			if (!node || typeof node !== 'object') {
				return;
			}

			if ((node.type === 'inlineMath' || node.type === 'math') && typeof node.value === 'string') {
				node.value = node.value.replace(/\\\\([A-Za-z]+)/g, (_, command) => `\\${command}`);
			}

			if (Array.isArray(node.children)) {
				for (const child of node.children) {
					walk(child);
				}
			}
		}

		walk(tree);
	};
}

function rehypeEscapeKatexTextNodes() {
	return (tree) => {
		function walk(node, inKatex = false) {
			if (!node || typeof node !== 'object') {
				return;
			}

			const className = Array.isArray(node.properties?.className) ? node.properties.className : [];
			const currentInKatex = inKatex || className.includes('katex');

			if (currentInKatex && node.type === 'text' && typeof node.value === 'string') {
				node.value = node.value.replaceAll('<', '&lt;');
			}

			if (Array.isArray(node.children)) {
				for (const child of node.children) {
					walk(child, currentInKatex);
				}
			}
		}

		walk(tree);
	};
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.md'],
	preprocess: [
		vitePreprocess(),
			mdsvex({
				extensions: ['.md'],
				remarkPlugins: [remarkMath, remarkNormalizeMathCommands],
				rehypePlugins: [
					rehypeSlug,
					[rehypeKatex, { output: 'html', strict: 'ignore' }],
					rehypeEscapeKatexTextNodes
				]
			})
		],
	kit: {
		adapter: adapter(),
		alias: {
			'$post-components': postComponentsAliasTarget
		},
		paths: {
			base: basePath
		},
		prerender: {
			entries: ['*']
		}
	}
};

export default config;
