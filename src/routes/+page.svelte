<script lang="ts">
	import { ArrowRight, Atom, BookOpenText, Cpu, Sparkles } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import PostCard from '$lib/components/blog/post-card.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import MathExpression from '$lib/components/math/math-expression.svelte';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import LissajousCanvas from '$lib/components/math/lissajous-canvas.svelte';
	import WasmPolynomialExplorer from '$lib/components/math/wasm-polynomial-explorer.svelte';
	import { posts } from '$lib/content/posts';

	const featuredPost = posts.find((post) => post.featured) ?? posts[0];
	const feed = posts.filter((post) => post.slug !== featuredPost.slug);
</script>

<div class="space-y-10 sm:space-y-12">
	<section class="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
		<div
			class="soft-grid relative min-w-0 overflow-hidden rounded-3xl border border-border/70 bg-card/78 p-5 shadow-sm backdrop-blur-sm sm:p-10"
		>
			<div class="space-y-5">
				<Badge class="border border-primary/20 bg-primary/12 px-3 py-1 text-xs text-primary sm:text-sm">
					<Sparkles class="mr-1.5 size-3.5" />
					Math + Design + Computation
				</Badge>

				<div class="space-y-4">
					<h1 class="max-w-xl text-3xl leading-tight tracking-tight sm:text-5xl lg:text-6xl">
						A clean, visual home for modern math stories.
					</h1>
					<p class="max-w-2xl text-sm text-muted-foreground sm:text-lg">
						Mathnasium Journal is a static Svelte 5 blog focused on elegant explanations, interactive
						visuals, and fast browser-native experiments.
					</p>
				</div>

				<div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
					<Button href={resolve('/posts')} class="w-full justify-center gap-1.5 sm:w-auto">
						Read articles
						<ArrowRight class="size-4" />
					</Button>
					<Button
						href={resolve('/posts/wasm-newton-lab')}
						variant="secondary"
						class="w-full justify-center gap-1.5 sm:w-auto"
					>
						<Cpu class="size-4" />
						Open WASM Lab
					</Button>
				</div>
			</div>
		</div>

		<Card class="min-w-0 border-border/70 bg-card/85 backdrop-blur-sm">
			<CardHeader class="space-y-2">
				<Badge variant="secondary" class="w-fit border border-border/80 bg-background/70">
					Featured Post
				</Badge>
				<CardTitle class="text-xl sm:text-2xl">{featuredPost.title}</CardTitle>
				<p class="text-sm text-muted-foreground">{featuredPost.subtitle}</p>
			</CardHeader>
			<CardContent class="space-y-4 text-sm">
				<p class="text-muted-foreground">{featuredPost.excerpt}</p>
				<p class="rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-xs">
					<MathExpression
						math={featuredPost.equation}
						class="overflow-x-auto [&_.katex]:text-[0.95em]"
					/>
				</p>
				<div class="flex flex-wrap gap-2">
					{#each featuredPost.tags as tag (tag)}
						<Badge variant="outline">{tag}</Badge>
					{/each}
				</div>
				<Button href={resolve(`/posts/${featuredPost.slug}`)} variant="outline" class="w-full gap-1.5">
					<BookOpenText class="size-4" />
					Read "{featuredPost.title}"
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
					<p class="text-base font-semibold sm:text-lg">Interactive first</p>
					<p class="text-xs text-muted-foreground">Every post includes a visual model.</p>
				</div>
			</CardContent>
		</Card>
		<Card class="min-w-0 border-border/70 bg-card/80 backdrop-blur-sm">
			<CardContent class="flex min-w-0 items-center gap-3 py-5">
				<div class="rounded-lg bg-primary/12 p-2 text-primary">
					<Cpu class="size-5" />
				</div>
				<div class="min-w-0">
					<p class="text-base font-semibold sm:text-lg">WASM experiments</p>
					<p class="text-xs text-muted-foreground">Numerical kernels run directly in browser.</p>
				</div>
			</CardContent>
		</Card>
		<Card class="min-w-0 border-border/70 bg-card/80 backdrop-blur-sm">
			<CardContent class="flex min-w-0 items-center gap-3 py-5">
				<div class="rounded-lg bg-primary/12 p-2 text-primary">
					<BookOpenText class="size-5" />
				</div>
				<div class="min-w-0">
					<p class="text-base font-semibold sm:text-lg">Static + fast</p>
					<p class="text-xs text-muted-foreground">Optimized for static hosting and low friction.</p>
				</div>
			</CardContent>
		</Card>
	</section>

	<section class="space-y-4 rounded-3xl border border-border/70 bg-card/78 p-5 shadow-sm backdrop-blur-sm sm:p-8">
		<div class="space-y-1">
			<h2 class="text-2xl leading-tight sm:text-3xl">Live Math Studio</h2>
			<p class="text-sm text-muted-foreground">
				Switch between animated curves and a WebAssembly-backed Newton solver.
			</p>
		</div>

		<Tabs value="curves" class="gap-4">
			<TabsList class="grid w-full grid-cols-2 sm:max-w-xs">
				<TabsTrigger value="curves">Curves</TabsTrigger>
				<TabsTrigger value="wasm">WASM Solver</TabsTrigger>
			</TabsList>
			<TabsContent value="curves" class="mt-0">
				<LissajousCanvas />
			</TabsContent>
			<TabsContent value="wasm" class="mt-0">
				<WasmPolynomialExplorer />
			</TabsContent>
		</Tabs>
	</section>

	<section class="space-y-5">
		<div class="flex items-end justify-between gap-3">
			<div>
				<h2 class="text-2xl leading-tight sm:text-3xl">Latest Posts</h2>
				<p class="text-sm text-muted-foreground">Three polished entries to launch the math blog.</p>
			</div>
			<Button href={resolve('/posts')} variant="ghost" class="hidden gap-1.5 sm:inline-flex">
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
