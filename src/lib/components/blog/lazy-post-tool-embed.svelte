<script lang="ts">
	import { onMount } from 'svelte';
	import type { Component } from 'svelte';
	import { resolve } from '$app/paths';
	import { loadInteractiveToolComponentById } from '$lib/components/math/tool-component-map';

	type Props = {
		toolId: string;
		title: string;
		rootMargin?: string;
		placeholderClass?: string;
	};

	type EmbedState = 'idle' | 'loading' | 'ready' | 'failed';

	let {
		toolId,
		title,
		rootMargin = '280px 0px',
		placeholderClass = ''
	}: Props = $props();

	let hostElement: HTMLDivElement | null = $state(null);
	let ToolComponent: Component | null = $state(null);
	let embedState: EmbedState = $state('idle');
	let hasRequestedLoad = false;

	async function loadToolComponent() {
		if (hasRequestedLoad || embedState === 'ready') {
			return;
		}

		hasRequestedLoad = true;
		embedState = 'loading';

		try {
			const loadedComponent = await loadInteractiveToolComponentById(toolId);
			if (!loadedComponent) {
				embedState = 'failed';
				return;
			}

			ToolComponent = loadedComponent;
			embedState = 'ready';
		} catch {
			embedState = 'failed';
		}
	}

	onMount(() => {
		if (!hostElement || typeof IntersectionObserver === 'undefined') {
			void loadToolComponent();
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => entry.isIntersecting)) {
					return;
				}

				observer.disconnect();
				void loadToolComponent();
			},
			{
				rootMargin,
				threshold: 0.01
			}
		);

		observer.observe(hostElement);

		return () => {
			observer.disconnect();
		};
	});
</script>

<div
	bind:this={hostElement}
	class={`min-h-[13rem] overflow-hidden rounded-xl border border-border/60 bg-background/70 ${placeholderClass}`.trim()}
>
	{#if embedState === 'ready' && ToolComponent}
		<ToolComponent />
	{:else if embedState === 'failed'}
		<div class="soft-grid flex min-h-[13rem] flex-col items-center justify-center gap-2 p-4 text-center">
			<p class="text-sm font-medium text-foreground">Unable to load {title} right now.</p>
			<a
				href={resolve(`/tools/${toolId}`)}
				class="text-xs font-medium text-primary underline-offset-4 hover:underline"
			>
				Open this tool on the resources page
			</a>
		</div>
	{:else}
		<div class="soft-grid min-h-[13rem] p-4">
			<div class="flex h-full flex-col justify-center gap-3">
				<p class="text-sm font-medium text-foreground">{title}</p>
				<div class="h-2.5 w-full max-w-xs animate-pulse rounded-full bg-primary/15"></div>
				<div class="h-2.5 w-4/5 max-w-sm animate-pulse rounded-full bg-border/70"></div>
				<p class="text-xs text-muted-foreground">
					Interactive will load as you scroll.
				</p>
			</div>
		</div>
	{/if}
</div>
