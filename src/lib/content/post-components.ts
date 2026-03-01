import type { Component } from 'svelte';

type PostComponentModule = {
	default: Component;
};

const componentModules = import.meta.glob<PostComponentModule>('/src/content/posts/*.md', {
	eager: true
});

const componentMap = new Map(
	Object.entries(componentModules).map(([path, module]) => {
		const filename = path.split('/').at(-1) ?? '';
		const slug = filename.replace('.md', '');
		return [slug, module.default] as const;
	})
);

export function getPostComponentBySlug(slug: string) {
	return componentMap.get(slug);
}
