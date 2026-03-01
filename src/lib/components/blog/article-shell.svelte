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

<article class="mx-auto max-w-4xl space-y-6 sm:space-y-8">
	<header class="space-y-4 rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-sm sm:space-y-5 sm:p-8">
		<div class="flex flex-wrap items-center gap-2">
			{#each tags as tag (tag)}
				<Badge variant="secondary" class="border border-border/80 bg-background/70">
					{tag}
				</Badge>
			{/each}
		</div>

		<div class="space-y-2">
			<h1 class="text-3xl leading-tight tracking-tight sm:text-5xl">{title}</h1>
			<p class="max-w-3xl text-sm text-muted-foreground sm:text-lg">{subtitle}</p>
		</div>

		<div class="flex flex-col items-start gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
			<span>{publishedOn}</span>
			<span>{readTime} read</span>
			<MathExpression
				math={equation}
				class="max-w-full overflow-x-auto text-foreground/85 [&_.katex]:text-[0.92em] sm:[&_.katex]:text-[1em]"
			/>
		</div>
	</header>

	<Separator />

	<div
		class="prose prose-sm max-w-none prose-headings:font-semibold prose-headings:text-foreground prose-p:text-foreground/90 prose-li:text-foreground/90 prose-strong:text-foreground prose-th:text-foreground prose-td:text-foreground/85 prose-blockquote:text-foreground/80 prose-a:text-primary prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-foreground prose-pre:border prose-pre:border-border/70 prose-pre:bg-background/80 sm:prose-base"
	>
		{@render children?.()}
	</div>
</article>
