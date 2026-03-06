<script lang="ts">
	import { BookOpenText, Calculator, Home } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';

	const homePath = resolve('/');
	const postsPath = resolve('/posts');
	const toolsPath = resolve('/tools');
</script>

<section class="mx-auto flex w-full max-w-3xl flex-1 items-center">
	<div
		class="soft-grid relative w-full overflow-hidden rounded-[2rem] border border-border/70 bg-card/82 p-6 shadow-sm backdrop-blur-sm sm:p-8 lg:p-10"
	>
		<div class="relative space-y-5">
			<div class="space-y-3">
				<h1 class="max-w-xl text-3xl leading-tight tracking-tight sm:text-4xl lg:text-5xl">
					Page not found.
				</h1>
				<p class="max-w-2xl text-sm text-muted-foreground sm:text-base">
					The page you asked for isn't here, but the rest of Mathnasium Pro is.
					Explore the latest posts, try out a learning resource, or head back to the homepage.
				</p>
			</div>

			<div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
				<Button href={homePath} class="w-full justify-center gap-1.5 sm:w-auto">
					<Home class="size-4" />
					Back to home
				</Button>
				<Button
					href={postsPath}
					variant="outline"
					class="w-full justify-center gap-1.5 hover:!bg-card/82 hover:!text-foreground hover:!shadow-none sm:w-auto"
				>
					<BookOpenText class="size-4" />
					Browse posts
				</Button>
				<Button
					href={toolsPath}
					variant="outline"
					class="w-full justify-center gap-1.5 hover:!bg-card/82 hover:!text-foreground hover:!shadow-none sm:w-auto"
				>
					<Calculator class="size-4" />
					View tools
				</Button>
			</div>
		</div>
	</div>
</section>
