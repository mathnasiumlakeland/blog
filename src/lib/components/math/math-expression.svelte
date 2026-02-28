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
