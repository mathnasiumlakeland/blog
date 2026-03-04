import { error } from '@sveltejs/kit';
import { posts } from '$lib/content/posts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const featuredPost = posts.find((post) => post.featured) ?? posts[0];

	if (!featuredPost) {
		throw error(500, 'No posts are available.');
	}

	return {
		featuredPost,
		feed: posts.filter((post) => post.slug !== featuredPost.slug)
	};
};
