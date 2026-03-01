<script lang="ts">
	import PostCard from '$lib/components/blog/post-card.svelte';
	import { posts } from '$lib/content/posts';
</script>

<section class="space-y-6">
	<div class="space-y-2">
		<h1 class="text-3xl leading-tight sm:text-5xl">All Posts</h1>
		<p class="max-w-2xl text-sm text-muted-foreground sm:text-base">
			A curated set of math notes and interactive visual explorations.
		</p>
	</div>

	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each posts as post (post.slug)}
			<PostCard {post} />
		{/each}
	</div>
</section>
