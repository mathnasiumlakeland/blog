<script lang="ts">
	import ArticleShell from '$lib/components/blog/article-shell.svelte';
	import { getPostComponentBySlug } from '$lib/content/posts';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const Content = $derived(getPostComponentBySlug(data.post.slug));
</script>

{#if Content}
	<ArticleShell
		title={data.post.title}
		subtitle={data.post.subtitle}
		equation={data.post.equation}
		publishedOn={data.post.publishedOn}
		readTime={data.post.readTime}
		tags={data.post.tags}
	>
		<Content />
	</ArticleShell>
{/if}
