<script lang="ts">
	import MathExpression from '$lib/components/math/math-expression.svelte';

	type Segment = {
		kind: 'text' | 'math';
		value: string;
		displayMode?: boolean;
	};

	type Props = {
		text: string;
		class?: string;
		mathClass?: string;
	};

	let { text, class: className = '', mathClass = '' }: Props = $props();

	function parseInlineMathSegments(value: string): Segment[] {
		const segments: Segment[] = [];
		let buffer = '';
		let delimiterLength: 0 | 1 | 2 = 0;

		for (let index = 0; index < value.length; index += 1) {
			const char = value[index];
			if (char === '\\' && value[index + 1] === '$') {
				buffer += '$';
				index += 1;
				continue;
			}

			if (char !== '$') {
				buffer += char;
				continue;
			}

			const nextIsDollar = value[index + 1] === '$';

			if (delimiterLength === 0) {
				if (buffer.length > 0) {
					segments.push({ kind: 'text', value: buffer });
				}
				buffer = '';
				delimiterLength = nextIsDollar ? 2 : 1;
				if (nextIsDollar) {
					index += 1;
				}
				continue;
			}

			if (delimiterLength === 2 && nextIsDollar) {
				segments.push({
					kind: 'math',
					value: buffer,
					displayMode: true
				});
				buffer = '';
				delimiterLength = 0;
				index += 1;
				continue;
			}

			if (delimiterLength === 1 && !nextIsDollar) {
				segments.push({
					kind: 'math',
					value: buffer,
					displayMode: false
				});
				buffer = '';
				delimiterLength = 0;
				continue;
			}

			buffer += '$';
		}

		if (delimiterLength === 2) {
			segments.push({ kind: 'text', value: `$$${buffer}` });
		} else if (delimiterLength === 1) {
			segments.push({ kind: 'text', value: `$${buffer}` });
		} else if (buffer.length > 0) {
			segments.push({ kind: 'text', value: buffer });
		}

		return segments;
	}

	const segments = $derived(parseInlineMathSegments(text));
</script>

<span class={className}>
	{#each segments as segment, index (`${segment.kind}-${index}`)}
		{#if segment.kind === 'math'}
			<MathExpression math={segment.value} displayMode={Boolean(segment.displayMode)} class={mathClass} />
		{:else}
			{segment.value}
		{/if}
	{/each}
</span>
