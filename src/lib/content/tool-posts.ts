import { getInteractiveToolComponentSourceById } from '$lib/components/math/tool-component-map';
import { getInteractiveToolIds } from '$lib/components/math/tool-registry';
import { posts } from './posts';

export type ToolPostReference = {
	slug: string;
	title: string;
	publishedOn: string;
	publishedAt: string;
};

const rawMarkdownModules = import.meta.glob<string>('/src/content/posts/*.md', {
	eager: true,
	import: 'default',
	query: '?raw'
});

const postBySlug = new Map(posts.map((post) => [post.slug, post]));
const postsByToolId = new Map<string, ToolPostReference[]>();

for (const toolId of getInteractiveToolIds()) {
	const componentSource = getInteractiveToolComponentSourceById(toolId);
	if (!componentSource) {
		postsByToolId.set(toolId, []);
		continue;
	}

	const matcher = new RegExp(`\\$lib/components/math/${escapeRegExp(componentSource)}`);
	const relatedPosts: ToolPostReference[] = [];

	for (const [path, source] of Object.entries(rawMarkdownModules)) {
		if (!matcher.test(source)) continue;

		const filename = path.split('/').at(-1) ?? '';
		const slug = filename.replace('.md', '');
		const post = postBySlug.get(slug);

		if (!post) continue;

		relatedPosts.push({
			slug: post.slug,
			title: post.title,
			publishedOn: post.publishedOn,
			publishedAt: post.publishedAt
		});
	}

	relatedPosts.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
	postsByToolId.set(toolId, relatedPosts);
}

function escapeRegExp(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function getPostsUsingInteractiveToolId(toolId: string) {
	return postsByToolId.get(toolId) ?? [];
}
