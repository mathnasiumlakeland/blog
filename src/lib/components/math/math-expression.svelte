<script module lang="ts">
	import type { MathToolMeta } from './tool-meta';

	export const toolMeta: MathToolMeta = {
		id: 'math-expression',
		title: 'Math Expression Renderer',
		description: 'Render TeX strings as KaTeX output for inline or display equations.',
		inputs: 'TeX math string plus optional display mode and CSS class.',
		outputs: 'Rendered KaTeX HTML with fallback plain text if rendering fails.',
		useCase: 'Use inside Svelte UIs whenever equations must appear as math instead of raw TeX.',
		tags: ['equations', 'katex', 'rendering', 'utility'],
		audience: ['instructors', 'content-authors'],
		kind: 'helper'
	};
</script>

<script lang="ts">
	import katex from 'katex';

	type Props = {
		math: string;
		displayMode?: boolean;
		class?: string;
	};

	let { math, displayMode = false, class: className = '' }: Props = $props();

	const html = $derived.by(() => {
		try {
			return katex.renderToString(math, {
				displayMode,
				throwOnError: false
			});
		} catch {
			return '';
		}
	});
</script>

{#if html}
	<span class={className}>{@html html}</span>
{:else}
	<span class={className}>{math}</span>
{/if}
