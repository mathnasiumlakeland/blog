import adapter from '@sveltejs/adapter-static';
import { mdsvex } from 'mdsvex';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const basePath = (() => {
	const value = process.env.BASE_PATH?.trim() ?? '';
	if (!value || value === '/') return '';
	return value.endsWith('/') ? value.slice(0, -1) : value;
})();

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.md'],
	preprocess: [
		vitePreprocess(),
		mdsvex({
			extensions: ['.md'],
			remarkPlugins: [remarkMath],
			rehypePlugins: [[rehypeKatex, { output: 'html' }]]
		})
	],
	kit: {
		adapter: adapter(),
		paths: {
			base: basePath
		},
		prerender: {
			entries: ['*']
		}
	}
};

export default config;
