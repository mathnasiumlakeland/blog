import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageLoad } from './$types';
import { getPostBySlug, getPostSlugs } from '$lib/content/posts';

export const prerender = true;

export const entries: EntryGenerator = () => {
	return getPostSlugs().map((slug) => ({ slug }));
};

export const load: PageLoad = ({ params }) => {
	const post = getPostBySlug(params.slug);

	if (!post) {
		throw error(404, 'Post not found');
	}

	return { post };
};
