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
			tags: assertTags(metadata.tags, path),
			equation: assertString(metadata.equation, 'equation', path),
			featured: metadata.featured
		};
	})
	.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));

const postMap = new Map(records.map((record) => [record.slug, record]));

export const posts: BlogPost[] = records;

export function getPostSlugs() {
	return records.map((record) => record.slug);
}

export function getPostBySlug(slug: string) {
	return postMap.get(slug);
}
