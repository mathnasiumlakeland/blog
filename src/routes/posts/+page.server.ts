import { posts } from '$lib/content/posts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return {
		posts
	};
};
