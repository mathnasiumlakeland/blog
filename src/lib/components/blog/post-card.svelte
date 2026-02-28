<script lang="ts">
	import { resolve } from '$app/paths';
	import type { BlogPost } from '$lib/content/posts';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import MathExpression from '$lib/components/math/math-expression.svelte';
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';

	let { post }: { post: BlogPost } = $props();
</script>

<Card class="h-full border-border/70 bg-card/85 backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-lg">
	<CardHeader class="gap-2.5 sm:gap-3">
		<div class="flex flex-wrap items-center gap-2">
			{#each post.tags as tag (tag)}
				<Badge variant="secondary" class="border border-border/80 bg-background/70 text-[11px]">
					{tag}
				</Badge>
			{/each}
		</div>
		<CardTitle class="text-lg leading-tight sm:text-xl">{post.title}</CardTitle>
		<CardDescription class="text-sm">
			{post.subtitle}
		</CardDescription>
	</CardHeader>

	<CardContent class="space-y-3 text-sm text-muted-foreground">
		<p>{post.excerpt}</p>
		<p class="text-xs text-foreground/90">
			<MathExpression math={post.equation} class="overflow-x-auto [&_.katex]:text-[0.95em]" />
		</p>
	</CardContent>

	<CardFooter
		class="mt-auto flex flex-col items-start gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"
	>
		<div class="flex flex-wrap items-center gap-x-3 gap-y-1">
			<span>{post.publishedOn}</span>
			<span>{post.readTime}</span>
		</div>
		<Button href={resolve(`/posts/${post.slug}`)} variant="link" class="h-auto p-0">
			Read article
		</Button>
	</CardFooter>
</Card>
