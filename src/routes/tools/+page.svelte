<script lang="ts">
	import { BookOpenText, Calculator, House } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import LazyToolPreview from '$lib/components/math/lazy-tool-preview.svelte';
	import { interactiveMathTools } from '$lib/components/math/tool-registry';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';

	const tools = interactiveMathTools;
	const interactiveCount = interactiveMathTools.length;
</script>

<div class="space-y-8 sm:space-y-10">
	<section class="soft-grid rounded-3xl border border-border/70 bg-card/78 p-5 shadow-sm backdrop-blur-sm sm:p-8">
		<div class="space-y-4">
			<Badge class="w-fit border border-primary/20 bg-primary/12 px-3 py-1 text-[11px] text-primary sm:text-sm">
				<Calculator class="size-3.5" />
				Tools & Resources
			</Badge>
			<div class="space-y-2">
				<h1 class="text-3xl leading-tight sm:text-4xl">Practice and Teaching Tools</h1>
				<p class="max-w-3xl text-sm text-muted-foreground sm:text-base">
					Use these resources at home for extra practice or in-center for teaching moments.
				</p>
			</div>
			<div class="flex flex-wrap gap-2 text-xs sm:text-sm">
				<Badge variant="outline">{interactiveCount} interactive tools</Badge>
			</div>
			<div class="flex flex-wrap gap-2">
				<Button href={resolve('/')} variant="outline" class="gap-1.5 hover:!bg-card/82 hover:!text-foreground hover:!shadow-none">
					<House class="size-4" />
					Back to home
				</Button>
				<Button href={resolve('/posts')} variant="secondary" class="gap-1.5">
					<BookOpenText class="size-4" />
					View posts
				</Button>
			</div>
		</div>
	</section>

	<section class="grid gap-4 lg:grid-cols-2">
		{#each tools as tool (tool.meta.id)}
			<a href={resolve(`/tools/${tool.meta.id}`)} class="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
				<Card class="h-full border-border/70 bg-card/82 backdrop-blur-sm transition-colors hover:border-primary/40">
					<CardHeader class="space-y-2 pb-3">
						<CardTitle class="text-xl">{tool.meta.title}</CardTitle>
						<p class="text-sm text-muted-foreground">{tool.meta.description}</p>
					</CardHeader>
					<CardContent class="space-y-3">
						<LazyToolPreview toolId={tool.id} title={tool.meta.title} />

						<div class="space-y-1 text-sm text-muted-foreground">
							<p><span class="font-semibold text-foreground">Inputs:</span> {tool.meta.inputs}</p>
							<p><span class="font-semibold text-foreground">Outputs:</span> {tool.meta.outputs}</p>
							<p><span class="font-semibold text-foreground">Used for:</span> {tool.meta.useCase}</p>
						</div>

						<div class="flex flex-wrap gap-1.5">
							{#each tool.meta.tags as tag (tag)}
								<Badge variant="outline">{tag}</Badge>
							{/each}
						</div>
					</CardContent>
				</Card>
			</a>
		{/each}
	</section>
</div>
