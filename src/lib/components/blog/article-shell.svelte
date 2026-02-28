<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Badge } from '$lib/components/ui/badge';
	import MathExpression from '$lib/components/math/math-expression.svelte';
	import { Separator } from '$lib/components/ui/separator';

	type Props = {
		title: string;
		subtitle: string;
		equation: string;
		publishedOn: string;
		readTime: string;
		tags: string[];
		children?: Snippet;
	};

	let { title, subtitle, equation, publishedOn, readTime, tags, children }: Props = $props();
</script>

<article class="mx-auto max-w-4xl space-y-8">
	<header class="space-y-5 rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur-sm sm:p-8">
		<div class="flex flex-wrap items-center gap-2">
			{#each tags as tag (tag)}
				<Badge variant="secondary" class="border border-border/80 bg-background/70">
					{tag}
				</Badge>
			{/each}
		</div>

		<div class="space-y-2">
			<h1 class="text-4xl leading-tight tracking-tight sm:text-5xl">{title}</h1>
			<p class="max-w-3xl text-base text-muted-foreground sm:text-lg">{subtitle}</p>
		</div>

		<div class="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
			<span>{publishedOn}</span>
			<span>{readTime} read</span>
			<MathExpression math={equation} class="text-foreground/85" />
		</div>
	</header>

	<Separator />

	<div class="prose prose-stone prose-headings:font-semibold prose-a:text-primary prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-pre:border prose-pre:border-border/70 max-w-none">
		{@render children?.()}
	</div>
</article>
