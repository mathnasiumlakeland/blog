import { error } from '@sveltejs/kit';
import { getPostBySlug, getPostSlugs } from '$lib/content/posts';
import { getPostHeadingsBySlug } from '$lib/content/post-headings';
import type { EntryGenerator, PageServerLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => {
	return getPostSlugs().map((slug) => ({ slug }));
};

export const load: PageServerLoad = ({ params }) => {
	const post = getPostBySlug(params.slug);

	if (!post) {
		throw error(404, 'Post not found');
	}

	return {
		post,
		headings: getPostHeadingsBySlug(params.slug)
	};
};
