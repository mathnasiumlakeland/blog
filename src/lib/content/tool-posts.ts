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
const preferProductionPostsInDev = import.meta.env.DEV;

for (const toolId of getInteractiveToolIds()) {
	const componentSource = getInteractiveToolComponentSourceById(toolId);
	const componentMatcher = componentSource
		? new RegExp(`\\$lib/components/math/${escapeRegExp(componentSource)}`)
		: null;
	const relatedPostRecords: (typeof posts)[number][] = [];
	const seenSlugs = new Set<string>();

	for (const [path, source] of Object.entries(rawMarkdownModules)) {
		const hasComponentImportMatch = componentMatcher ? componentMatcher.test(source) : false;
		const hasToolEmbedMatch = hasLazyEmbedToolIdReference(source, toolId);
		if (!hasComponentImportMatch && !hasToolEmbedMatch) continue;

		const filename = path.split('/').at(-1) ?? '';
		const slug = filename.replace('.md', '');
		const post = postBySlug.get(slug);

		if (!post) continue;
		if (seenSlugs.has(post.slug)) continue;
		seenSlugs.add(post.slug);

		relatedPostRecords.push(post);
	}

	const visibleRelatedPostRecords =
		preferProductionPostsInDev && relatedPostRecords.some((post) => !post.devOnly)
			? relatedPostRecords.filter((post) => !post.devOnly)
			: relatedPostRecords;

	const relatedPosts: ToolPostReference[] = visibleRelatedPostRecords.map((post) => ({
		slug: post.slug,
		title: post.title,
		publishedOn: post.publishedOn,
		publishedAt: post.publishedAt
	}));

	relatedPosts.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
	postsByToolId.set(toolId, relatedPosts);
}

function escapeRegExp(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasLazyEmbedToolIdReference(source: string, toolId: string) {
	const matcher = new RegExp(
		`toolId\\s*=\\s*(?:["']${escapeRegExp(toolId)}["']|\\{\\s*["']${escapeRegExp(toolId)}["']\\s*\\})`
	);
	return matcher.test(source);
}

export function getPostsUsingInteractiveToolId(toolId: string) {
	return postsByToolId.get(toolId) ?? [];
}
