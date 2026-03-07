<script lang="ts">
	import {
		ArrowRight,
		Atom,
		BookOpenText,
		Cpu,
		ExternalLink,
		School
	} from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import PostCard from '$lib/components/blog/post-card.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import type { BlogPostDifficulty } from '$lib/content/posts';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import InlineMathText from '$lib/components/math/inline-math-text.svelte';
	import MathExpression from '$lib/components/math/math-expression.svelte';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import LissajousCanvas from '$lib/components/math/lissajous-canvas.svelte';
	import PolygonTriangulationVisual from '$lib/components/math/polygon-sum-of-interior-angles-visual.svelte';
	import PrimeFactorizationFactorTreeVisual from '$lib/components/math/prime-factorization-factor-tree-visual.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let spotlightTab = $state<'curves' | 'angle-sum' | 'factor-tree'>('curves');

	const featuredPost = $derived(data.featuredPost);
	const feed = $derived(data.feed);

	const difficultyBadgeClasses: Record<BlogPostDifficulty, string> = {
		beginner: 'border-teal-200/80 bg-teal-500/10 text-teal-700',
		intermediate: 'border-sky-200/80 bg-sky-500/10 text-sky-700',
		advanced: 'border-amber-200/80 bg-amber-500/10 text-amber-700',
		pro: 'border-rose-200/80 bg-rose-500/10 text-rose-700'
	};
</script>

<div class="space-y-10 sm:space-y-12">
	<!-- <section class="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start"> -->
	<section class="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
		<div
			class="soft-grid relative min-w-0 overflow-hidden rounded-3xl border border-border/70 bg-card/78 p-5 shadow-sm backdrop-blur-sm sm:p-10 lg:flex lg:h-full lg:flex-col"
		>
			<div class="space-y-5 lg:flex lg:h-full lg:flex-col lg:space-y-0">
				<Badge
					href="https://www.mathnasium.com/math-centers/lakelandhighlands"
					target="_blank"
					rel="noopener noreferrer"
					class="w-fit border border-primary/20 bg-primary/12 px-3 py-1 text-[11px] text-primary hover:!bg-primary/16 sm:text-sm"
				>
					<School class="mr-1.5 size-3.5" />
					Mathnasium Lakeland Highlands
				</Badge>

				<div class="space-y-5 lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:space-y-0">
					<div class="space-y-1 sm:space-y-3">

						<h1 class="max-w-xl text-3xl leading-tight tracking-tight sm:text-4xl lg:text-5xl">
							Math resources from our center, built for students and families.
						</h1>

						<p class="max-w-2xl text-sm text-muted-foreground sm:text-lg">
							Clear explanations, interactive visuals, and take-home ideas from
							Mathnasium Lakeland Highlands.
						</p>

						<div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
							<Button href={resolve('/posts')} class="w-full justify-center gap-1.5 sm:w-auto">
								Read latest posts
								<ArrowRight class="size-4" />
							</Button>
							<Button
								href="https://www.mathnasium.com/math-centers/lakelandhighlands"
								variant="secondary"
								class="w-full justify-center gap-1.5 sm:w-auto"
								target="_blank"
								rel="noopener noreferrer"
							>
								<ExternalLink class="size-4" />
								Visit center page
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>

		<Card class="flex h-full min-w-0 flex-col border-border/70 bg-card/85 backdrop-blur-sm lg:py-10">
			<CardHeader class="space-y-2">
				<div class="flex flex-wrap gap-2">
					<Badge variant="secondary" class="w-fit border border-border/80 bg-background/70">
						Featured Post
					</Badge>
					<Badge class={`w-fit border capitalize ${difficultyBadgeClasses[featuredPost.difficulty]}`}>
						{featuredPost.difficulty}
					</Badge>
				</div>
				<CardTitle class="text-xl sm:text-2xl">
					<InlineMathText text={featuredPost.title} />
				</CardTitle>
				<p class="text-sm text-muted-foreground">
					<InlineMathText text={featuredPost.subtitle} />
				</p>
			</CardHeader>
			<CardContent class="flex grow flex-col gap-4 text-sm">
				<div class="space-y-4">
					<p class="text-muted-foreground">
						<InlineMathText text={featuredPost.excerpt} />
					</p>
					<p class="w-fit max-w-full rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-xs sm:w-full">
						<MathExpression
							math={featuredPost.equation}
							class="overflow-x-auto [&_.katex]:text-[0.95em]"
						/>
					</p>
					<p class="text-xs text-muted-foreground">
						By {featuredPost.author} • {featuredPost.publishedOn} • {featuredPost.readTime}
					</p>
				</div>
				<Button
					href={resolve(`/posts/${featuredPost.slug}`)}
					variant="outline"
					class="mt-auto w-full gap-1.5 hover:!bg-card/82 hover:!text-foreground hover:!shadow-none"
				>
					<BookOpenText class="size-4" />
					<span>Read "</span>
					<InlineMathText text={featuredPost.title} />
					<span>"</span>
				</Button>
			</CardContent>
		</Card>
	</section>

	<section class="grid gap-4 sm:grid-cols-3">
		<Card class="min-w-0 border-border/70 bg-card/80 backdrop-blur-sm">
			<CardContent class="flex min-w-0 items-center gap-3 py-5">
				<div class="rounded-lg bg-primary/12 p-2 text-primary">
					<Atom class="size-5" />
				</div>
				<div class="min-w-0">
					<p class="text-base font-semibold sm:text-lg">Student-first explanations</p>
					<p class="text-xs text-muted-foreground">Short posts focused on clarity and confidence.</p>
				</div>
			</CardContent>
		</Card>
		<Card class="min-w-0 border-border/70 bg-card/80 backdrop-blur-sm">
			<CardContent class="flex min-w-0 items-center gap-3 py-5">
				<div class="rounded-lg bg-primary/12 p-2 text-primary">
					<Cpu class="size-5" />
				</div>
				<div class="min-w-0">
					<p class="text-base font-semibold sm:text-lg">Center-inspired visuals</p>
					<p class="text-xs text-muted-foreground">Interactive models connected to what we teach.</p>
				</div>
			</CardContent>
		</Card>
		<Card class="min-w-0 border-border/70 bg-card/80 backdrop-blur-sm">
			<CardContent class="flex min-w-0 items-center gap-3 py-5">
				<div class="rounded-lg bg-primary/12 p-2 text-primary">
					<BookOpenText class="size-5" />
				</div>
				<div class="min-w-0">
					<p class="text-base font-semibold sm:text-lg">Family-friendly resources</p>
					<p class="text-xs text-muted-foreground">Ideas parents and students can revisit anytime.</p>
				</div>
			</CardContent>
		</Card>
	</section>

	<section class="space-y-4 rounded-3xl border border-border/70 bg-card/78 p-5 shadow-sm backdrop-blur-sm sm:p-8">
		<div class="flex items-end justify-between gap-3">
			<div class="space-y-1">
				<h2 class="text-2xl leading-tight sm:text-3xl">Tool Spotlight</h2>
				<p class="text-sm text-muted-foreground">
					Interactive resources to make math make sense.
				</p>
			</div>
			<Button
				href={resolve('/tools')}
				variant="ghost"
				class="hidden gap-1.5 hover:!bg-transparent hover:!text-foreground hover:underline hover:shadow-none sm:inline-flex"
			>
				View all resources
				<ArrowRight class="size-4" />
			</Button>
		</div>

		<Tabs bind:value={spotlightTab} class="gap-4">
			<TabsList
				class="relative grid h-10 w-full grid-cols-3 overflow-hidden rounded-xl border border-border/70 bg-muted/70 p-1 sm:max-w-md"
			>
				<div aria-hidden="true" class="pointer-events-none absolute inset-1 z-0">
					<div
						class={`h-full w-1/3 rounded-lg border border-border/80 bg-background/95 shadow-[0_1px_2px_rgba(15,23,42,0.08)] transition-transform duration-300 ease-out ${
							spotlightTab === 'curves'
								? 'translate-x-0'
								: spotlightTab === 'angle-sum'
									? 'translate-x-full'
									: 'translate-x-[200%]'
						}`}
					></div>
				</div>
				<TabsTrigger
					value="curves"
					class="relative z-10 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
				>
					Patterns
				</TabsTrigger>
				<TabsTrigger
					value="angle-sum"
					class="relative z-10 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
				>
					Angle Sum
				</TabsTrigger>
				<TabsTrigger
					value="factor-tree"
					class="relative z-10 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
				>
					Factor Tree
				</TabsTrigger>
			</TabsList>
			{#if spotlightTab === 'curves'}
				<TabsContent value="curves" class="mt-0">
					<LissajousCanvas />
				</TabsContent>
			{/if}
			{#if spotlightTab === 'angle-sum'}
				<TabsContent value="angle-sum" class="mt-0">
					<PolygonTriangulationVisual />
				</TabsContent>
			{/if}
			{#if spotlightTab === 'factor-tree'}
				<TabsContent value="factor-tree" class="mt-0">
					<PrimeFactorizationFactorTreeVisual />
				</TabsContent>
			{/if}
		</Tabs>
		<Button href={resolve('/tools')} variant="outline" class="w-full gap-1.5 sm:hidden">
			View all resources
			<ArrowRight class="size-4" />
		</Button>
	</section>

	<section class="space-y-5">
		<div class="flex items-end justify-between gap-3">
			<div>
				<h2 class="text-2xl leading-tight sm:text-3xl">Latest Posts</h2>
				<p class="text-sm text-muted-foreground">Read our most recent posts.</p>
			</div>
			<Button
				href={resolve('/posts')}
				variant="ghost"
				class="hidden gap-1.5 hover:!bg-transparent hover:!text-foreground hover:underline hover:shadow-none sm:inline-flex"
			>
				View all
				<ArrowRight class="size-4" />
			</Button>
		</div>

		<div class="grid gap-4 md:grid-cols-2">
			{#each feed as post (post.slug)}
				<PostCard {post} />
			{/each}
		</div>

		<Button href={resolve('/posts')} variant="outline" class="w-full gap-1.5 sm:hidden">
			View all posts
			<ArrowRight class="size-4" />
		</Button>
	</section>
</div>
