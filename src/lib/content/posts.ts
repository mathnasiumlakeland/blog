import type { Component } from 'svelte';

export type BlogPost = {
	slug: string;
	title: string;
	subtitle: string;
	excerpt: string;
	publishedOn: string;
	publishedAt: string;
	readTime: string;
	tags: string[];
	equation: string;
	featured?: boolean;
};

type PostModule = {
	metadata: Omit<BlogPost, 'slug'>;
	default: Component;
};

type PostRecord = BlogPost & {
	component: Component;
};

function assertString(value: unknown, field: string, path: string): string {
	if (typeof value !== 'string' || value.trim() === '') {
		throw new Error(`Invalid frontmatter: "${field}" is required in ${path}`);
	}
	return value;
}

function assertTags(value: unknown, path: string): string[] {
	if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || item.trim() === '')) {
		throw new Error(`Invalid frontmatter: "tags" must be a string array in ${path}`);
	}
	return value;
}

const modules = import.meta.glob<PostModule>('/src/content/posts/*.md', {
	eager: true
});

const records: PostRecord[] = Object.entries(modules)
	.map(([path, module]) => {
		const filename = path.split('/').at(-1) ?? '';
		const slug = filename.replace('.md', '');
		const metadata = module.metadata as Partial<Omit<BlogPost, 'slug'>>;
		return {
			slug,
			title: assertString(metadata.title, 'title', path),
			subtitle: assertString(metadata.subtitle, 'subtitle', path),
			excerpt: assertString(metadata.excerpt, 'excerpt', path),
			publishedOn: assertString(metadata.publishedOn, 'publishedOn', path),
			publishedAt: assertString(metadata.publishedAt, 'publishedAt', path),
			readTime: assertString(metadata.readTime, 'readTime', path),
			tags: assertTags(metadata.tags, path),
			equation: assertString(metadata.equation, 'equation', path),
			featured: metadata.featured,
			component: module.default
		};
	})
	.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));

const postMap = new Map(records.map((record) => [record.slug, record]));

export const posts: BlogPost[] = records.map(({ component, ...post }) => post);

export function getPostSlugs() {
	return records.map((record) => record.slug);
}

export function getPostBySlug(slug: string) {
	const post = postMap.get(slug);
	if (!post) {
		return undefined;
	}

	const { component, ...metadata } = post;
	return metadata;
}

export function getPostComponentBySlug(slug: string) {
	return postMap.get(slug)?.component;
}
