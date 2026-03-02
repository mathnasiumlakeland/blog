<script lang="ts">
	import {
		BookOpenText,
		Calculator,
		ChevronDown,
		ChevronUp,
		House,
		Search,
		SlidersHorizontal,
		X
	} from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import InlineMathText from '$lib/components/math/inline-math-text.svelte';
	import LazyToolPreview from '$lib/components/math/lazy-tool-preview.svelte';
	import { interactiveMathTools } from '$lib/components/math/tool-registry';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { slide } from 'svelte/transition';

	const tools = interactiveMathTools;
	const interactiveCount = interactiveMathTools.length;
	const availableTags = [...new Set(tools.flatMap((tool) => tool.meta.tags))].sort((a, b) =>
		a.localeCompare(b)
	);

	let searchQuery = $state('');
	let selectedTags = $state<string[]>([]);
	let filtersExpanded = $state(false);

	const normalizedSearchQuery = $derived(searchQuery.trim().toLowerCase());
	const hasSelectedTags = $derived(selectedTags.length > 0);
	const hasActiveFilters = $derived(Boolean(normalizedSearchQuery) || hasSelectedTags);
	const showClearAction = $derived(filtersExpanded || hasSelectedTags);
	const filteredTools = $derived.by(() =>
		tools.filter((tool) => {
			const matchesTag = !hasSelectedTags || selectedTags.some((tag) => tool.meta.tags.includes(tag));
			if (!matchesTag) {
				return false;
			}

			if (!normalizedSearchQuery) {
				return true;
			}

			const searchableTags = tool.meta.tags.flatMap((tag) => [tag, tag.replaceAll('-', ' ')]);
			const searchableText = [
				tool.meta.title,
				tool.meta.description,
				tool.meta.inputs,
				tool.meta.outputs,
				tool.meta.useCase,
				...searchableTags
			]
				.join(' ')
				.toLowerCase();

			return searchableText.includes(normalizedSearchQuery);
		})
	);

	function toggleTag(tag: string) {
		selectedTags = selectedTags.includes(tag)
			? selectedTags.filter((selectedTag) => selectedTag !== tag)
			: [...selectedTags, tag];
	}

	function clearFilters() {
		searchQuery = '';
		selectedTags = [];
	}

	function formatTag(tag: string) {
		return tag.replaceAll('-', ' ');
	}
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
					Resources for extra practice and in-center teaching.
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

	<section class="space-y-2 rounded-2xl border border-border/70 bg-card/76 p-4 shadow-sm backdrop-blur-sm sm:p-5">
		<div class="flex items-center gap-2">
			<div class="relative min-w-0 flex-1">
				<Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					id="tool-search"
					aria-label="Search tools"
					bind:value={searchQuery}
					placeholder="Search by title, topic, or use case"
					class="pl-9"
				/>
			</div>
			<Button
				type="button"
				size="sm"
				variant="outline"
				class="shrink-0 gap-1.5 hover:!bg-card/82 hover:!text-foreground hover:!shadow-none"
				aria-expanded={filtersExpanded}
				aria-controls="tool-filters-panel"
				onclick={() => (filtersExpanded = !filtersExpanded)}
			>
				<SlidersHorizontal class="size-3.5" />
				Filter by topic
				{#if filtersExpanded}
					<ChevronUp class="size-3.5" />
				{:else}
					<ChevronDown class="size-3.5" />
				{/if}
			</Button>
		</div>
			{#if hasActiveFilters}
				<div class="flex flex-wrap items-center justify-between gap-2">
					<p class="text-xs text-muted-foreground sm:text-sm" aria-live="polite">
						{filteredTools.length} {filteredTools.length === 1 ? 'result' : 'results'}
					</p>
					{#if showClearAction}
						<Button
							type="button"
							size="sm"
							variant="outline"
							class="gap-1 text-muted-foreground hover:!bg-card/82 hover:!text-foreground hover:!shadow-none"
							onclick={clearFilters}
						>
							<X class="size-3.5" />
							Clear
						</Button>
					{/if}
				</div>
			{/if}
			{#if filtersExpanded}
				<div id="tool-filters-panel" class="pt-1" transition:slide={{ duration: 180 }}>
					<div class="flex flex-wrap items-center gap-2">
						{#each availableTags as tag (tag)}
							<Button
								type="button"
								size="sm"
								variant={selectedTags.includes(tag) ? 'default' : 'outline'}
								aria-pressed={selectedTags.includes(tag)}
								class={selectedTags.includes(tag)
									? 'capitalize hover:!bg-primary hover:!text-primary-foreground'
									: 'capitalize hover:!bg-card/82 hover:!text-foreground hover:!shadow-none'}
								onclick={() => toggleTag(tag)}
							>
							{formatTag(tag)}
						</Button>
					{/each}
				</div>
			</div>
		{/if}
	</section>

	<section class="grid gap-4 lg:grid-cols-2">
		{#if filteredTools.length > 0}
			{#each filteredTools as tool (tool.meta.id)}
				<a href={resolve(`/tools/${tool.meta.id}`)} class="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
					<Card class="h-full border-border/70 bg-card/82 backdrop-blur-sm transition-colors hover:border-primary/40">
						<CardHeader class="space-y-2 pb-3">
							<CardTitle class="text-xl">
								<InlineMathText text={tool.meta.title} />
							</CardTitle>
							<p class="text-sm text-muted-foreground">
								<InlineMathText text={tool.meta.description} />
							</p>
						</CardHeader>
						<CardContent class="flex flex-1 flex-col gap-3">
							<LazyToolPreview toolId={tool.id} title={tool.meta.title} />
							<div class="mt-auto flex flex-wrap gap-1.5">
								{#each tool.meta.tags as tag (tag)}
									<Badge variant="outline">{tag}</Badge>
								{/each}
							</div>
						</CardContent>
					</Card>
				</a>
			{/each}
		{:else}
			<Card class="border-border/70 bg-card/82 lg:col-span-2">
				<CardHeader class="space-y-2 pb-2">
					<CardTitle class="text-xl">No matching tools</CardTitle>
					<p class="text-sm text-muted-foreground">
						Try a different search term or clear the active tag filter.
					</p>
				</CardHeader>
				<CardContent>
						<Button
							type="button"
							variant="outline"
							size="sm"
							class="gap-1.5 hover:!bg-card/82 hover:!text-foreground hover:!shadow-none"
							onclick={clearFilters}
							disabled={!hasActiveFilters}
							hidden={!showClearAction}
						>
							<X class="size-3.5" />
							Clear filters
					</Button>
				</CardContent>
			</Card>
		{/if}
	</section>
</div>
