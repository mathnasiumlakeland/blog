export const BLOG_POST_DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'pro'] as const;

export type BlogPostDifficulty = (typeof BLOG_POST_DIFFICULTIES)[number];

export type BlogPost = {
	slug: string;
	title: string;
	subtitle: string;
	excerpt: string;
	publishedOn: string;
	publishedAt: string;
	readTime: string;
	author: string;
	difficulty: BlogPostDifficulty;
	tags: string[];
	equation: string;
	featured?: boolean;
	devOnly?: boolean;
};

type PostMetadata = Partial<Omit<BlogPost, 'slug'>>;

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

function assertDifficulty(value: unknown, path: string): BlogPostDifficulty {
	if (
		typeof value !== 'string' ||
		!BLOG_POST_DIFFICULTIES.includes(value as BlogPostDifficulty)
	) {
		throw new Error(
			`Invalid frontmatter: "difficulty" must be one of ${BLOG_POST_DIFFICULTIES.join(', ')} in ${path}`
		);
	}

	return value as BlogPostDifficulty;
}

function assertBooleanOrUndefined(
	value: unknown,
	field: string,
	path: string
): boolean | undefined {
	if (value === undefined) {
		return undefined;
	}

	if (typeof value !== 'boolean') {
		throw new Error(`Invalid frontmatter: "${field}" must be a boolean in ${path}`);
	}

	return value;
}

const includeDevOnlyPosts = import.meta.env.DEV;

const metadataModules = import.meta.glob<PostMetadata>('/src/content/posts/*.md', {
	eager: true,
	import: 'metadata'
});

const records: BlogPost[] = Object.entries(metadataModules)
	.map(([path, metadata]) => {
		const filename = path.split('/').at(-1) ?? '';
		const slug = filename.replace('.md', '');
		return {
			slug,
			title: assertString(metadata.title, 'title', path),
			subtitle: assertString(metadata.subtitle, 'subtitle', path),
			excerpt: assertString(metadata.excerpt, 'excerpt', path),
			publishedOn: assertString(metadata.publishedOn, 'publishedOn', path),
			publishedAt: assertString(metadata.publishedAt, 'publishedAt', path),
			readTime: assertString(metadata.readTime, 'readTime', path),
			author: assertString(metadata.author, 'author', path),
			difficulty: assertDifficulty(metadata.difficulty, path),
			tags: assertTags(metadata.tags, path),
			equation: assertString(metadata.equation, 'equation', path),
			featured: metadata.featured,
			devOnly: assertBooleanOrUndefined(metadata.devOnly, 'devOnly', path)
		};
	})
	.filter((record) => includeDevOnlyPosts || !record.devOnly)
	.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));

const postMap = new Map(records.map((record) => [record.slug, record]));

export const posts: BlogPost[] = records;

export function getPostSlugs() {
	return records.map((record) => record.slug);
}

export function getPostBySlug(slug: string) {
	return postMap.get(slug);
}
