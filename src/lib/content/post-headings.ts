import GithubSlugger from 'github-slugger';

export type PostHeading = {
	id: string;
	text: string;
	level: number;
};

const rawMarkdownModules = import.meta.glob<string>('/src/content/posts/*.md', {
	eager: true,
	import: 'default',
	query: '?raw'
});

const headingMap = new Map(
	Object.entries(rawMarkdownModules).map(([path, source]) => {
		const filename = path.split('/').at(-1) ?? '';
		const slug = filename.replace('.md', '');
		return [slug, extractPostHeadings(source)] as const;
	})
);

export function getPostHeadingsBySlug(slug: string) {
	return headingMap.get(slug) ?? [];
}

function extractPostHeadings(markdown: string): PostHeading[] {
	const content = stripFrontmatter(markdown);
	const slugger = new GithubSlugger();
	const headings: PostHeading[] = [];

	let codeFence: string | null = null;
	let fenceLength = 0;

	for (const line of content.split(/\r?\n/)) {
		const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
		if (fenceMatch) {
			const marker = fenceMatch[1][0];
			const length = fenceMatch[1].length;

			if (!codeFence) {
				codeFence = marker;
				fenceLength = length;
			} else if (marker === codeFence && length >= fenceLength) {
				codeFence = null;
				fenceLength = 0;
			}

			continue;
		}

		if (codeFence) continue;

		const headingMatch = line.match(/^\s{0,3}(#{1,6})[ \t]+(.+?)\s*#*\s*$/);
		if (!headingMatch) continue;

		const level = headingMatch[1].length;
		if (level > 2) continue;

		const text = normalizeHeadingText(headingMatch[2]);
		if (!text) continue;

		headings.push({
			id: slugger.slug(text),
			text,
			level
		});
	}

	return headings;
}

function stripFrontmatter(markdown: string): string {
	const lines = markdown.split(/\r?\n/);
	if (lines[0]?.trim() !== '---') return markdown;

	const endIndex = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
	if (endIndex === -1) return markdown;

	return lines.slice(endIndex + 1).join('\n');
}

function normalizeHeadingText(value: string): string {
	return value
		.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
		.replace(/`([^`]+)`/g, '$1')
		.replace(/<[^>]+>/g, '')
		.replace(/(\*\*|__)(.*?)\1/g, '$2')
		.replace(/(\*|_)(.*?)\1/g, '$2')
		.replace(/~~(.*?)~~/g, '$1')
		.replace(/\\([\\`*_{}\[\]()#+\-.!])/g, '$1')
		.trim();
}
