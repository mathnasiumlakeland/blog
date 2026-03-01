<script lang="ts">
	import { BookOpenText, Calculator, Home } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import PostCard from '$lib/components/blog/post-card.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { posts } from '$lib/content/posts';
</script>

<div class="space-y-8 sm:space-y-10">
	<section class="soft-grid rounded-3xl border border-border/70 bg-card/78 p-5 shadow-sm backdrop-blur-sm sm:p-8">
		<div class="space-y-4">
			<Badge class="w-fit border border-primary/20 bg-primary/12 px-3 py-1 text-[11px] text-primary sm:text-sm">
				<BookOpenText class="size-3.5" />
				Step-by-Step Math
			</Badge>

			<div class="space-y-2">
				<h1 class="text-3xl leading-tight sm:text-4xl">All Posts</h1>
				<p class="max-w-3xl text-sm text-muted-foreground sm:text-base">
					Explore center-inspired explanations, visual math models, and take-home ideas for students.
				</p>
			</div>

			<div class="flex flex-wrap gap-2 text-xs sm:text-sm">
				<Badge variant="outline">{posts.length} published posts</Badge>
			</div>

			<div class="flex flex-wrap gap-2">
				<Button href={resolve('/')} variant="outline" class="gap-1.5 hover:!bg-card/82 hover:!text-foreground hover:!shadow-none">
					<Home class="size-4" />
					Back to home
				</Button>
				<Button href={resolve('/tools')} variant="secondary" class="gap-1.5">
					<Calculator class="size-4" />
					View tools
				</Button>
			</div>
		</div>
	</section>

	<section class="space-y-6">
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each posts as post (post.slug)}
				<PostCard {post} />
			{/each}
		</div>
	</section>
</div>
