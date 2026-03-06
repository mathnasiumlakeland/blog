<script lang="ts">
	import { resolve } from '$app/paths';
	import InlineMathText from '$lib/components/math/inline-math-text.svelte';
	import MathExpression from '$lib/components/math/math-expression.svelte';
	import type { BlogPost, BlogPostDifficulty } from '$lib/content/posts';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';

	const difficultyBadgeClasses: Record<BlogPostDifficulty, string> = {
		beginner: 'border-teal-200/80 bg-teal-500/10 text-teal-700',
		intermediate: 'border-sky-200/80 bg-sky-500/10 text-sky-700',
		advanced: 'border-amber-200/80 bg-amber-500/10 text-amber-700',
		pro: 'border-rose-200/80 bg-rose-500/10 text-rose-700'
	};

	let { post }: { post: BlogPost } = $props();
</script>

<Card class="h-full border-border/70 bg-card/85 backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-lg">
	<CardHeader class="flex flex-col gap-2.5 sm:gap-3">
		<div class="flex min-h-[2rem] flex-wrap items-center gap-2 md:min-h-[2.75rem]">
			<Badge
				class={`border text-[11px] capitalize ${difficultyBadgeClasses[post.difficulty]}`}
			>
				{post.difficulty}
			</Badge>
		</div>
		<div class="space-y-2">
			<CardTitle class="text-lg leading-tight sm:text-xl">
				<InlineMathText text={post.title} />
			</CardTitle>
			<CardDescription class="text-sm">
				<InlineMathText text={post.subtitle} />
			</CardDescription>
		</div>
	</CardHeader>

	<CardContent class="flex grow flex-col gap-3 text-sm text-muted-foreground">
		<p>
			<InlineMathText text={post.excerpt} />
		</p>
		<p
			class="mt-auto w-full max-w-full rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-xs text-foreground/90"
		>
			<MathExpression
				math={post.equation}
				class="overflow-x-auto [&_.katex]:text-[0.95em]"
			/>
		</p>
	</CardContent>

	<CardFooter
		class="flex flex-col items-start gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"
	>
		<div class="flex flex-wrap items-center gap-x-3 gap-y-1">
			<span>By {post.author}</span>
			<span>{post.publishedOn}</span>
			<span>{post.readTime}</span>
		</div>
		<Button
			href={resolve(`/posts/${post.slug}`)}
			variant="link"
			class="h-auto p-0"
		>
			Read article
		</Button>
	</CardFooter>
</Card>
