<script module lang="ts">
	import type { MathToolMeta } from './tool-meta';
	import { requireInteractiveToolMetaById } from './tool-registry';

	export const toolMeta: MathToolMeta = requireInteractiveToolMetaById('combinatorics-formula-lab');
</script>

<script lang="ts">
	import MathExpression from '$lib/components/math/math-expression.svelte';
	import { TOOL_BG_GRADIENT_END, TOOL_BG_GRADIENT_START } from './tool-visual-theme';

	type Mode =
		| 'permutation-replacement'
		| 'permutation-slots'
		| 'combination'
		| 'duplicates';

	type ModeOption = {
		id: Mode;
		label: string;
	};

	type SymbolToken = {
		id: string;
		label: string;
		duplicate: boolean;
	};

	const MODE_OPTIONS: ModeOption[] = [
		{ id: 'permutation-replacement', label: 'Permutations with replacement' },
		{ id: 'permutation-slots', label: 'Permutations in r slots' },
		{ id: 'combination', label: 'Combinations (nCr)' },
		{ id: 'duplicates', label: 'Duplicate items' }
	];

	const SVG_WIDTH = 620;
	const SVG_HEIGHT = 250;

	let mode = $state<Mode>('permutation-replacement');
	let n = $state(6);
	let r = $state(3);
	let duplicateCount = $state(2);

	const effectiveRMax = $derived(mode === 'permutation-replacement' ? 8 : n);
	const effectiveR = $derived(Math.min(Math.max(r, 1), effectiveRMax));
	const effectiveDuplicateCount = $derived(Math.min(Math.max(duplicateCount, 1), n));

	function factorialBigInt(value: number): bigint {
		if (value < 0) {
			return 0n;
		}

		let total = 1n;
		for (let current = 2; current <= value; current += 1) {
			total *= BigInt(current);
		}
		return total;
	}

	function multiplyFactors(values: number[]): bigint {
		let total = 1n;
		for (const value of values) {
			total *= BigInt(value);
		}
		return total;
	}

	function formatBigInt(value: bigint): string {
		return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	}

	function buildPermutations(symbols: string[]) {
		const results: string[] = [];
		const used = Array(symbols.length).fill(false);
		const path: string[] = [];

		const walk = () => {
			if (path.length === symbols.length) {
				results.push(path.join(''));
				return;
			}

			for (let index = 0; index < symbols.length; index += 1) {
				if (used[index]) {
					continue;
				}
				used[index] = true;
				path.push(symbols[index]);
				walk();
				path.pop();
				used[index] = false;
			}
		};

		walk();
		return results;
	}

	const replacementFactors = $derived(Array.from({ length: effectiveR }, () => n));
	const slotFactors = $derived(Array.from({ length: effectiveR }, (_, index) => n - index));

	const replacementCount = $derived(BigInt(n) ** BigInt(effectiveR));
	const slotPermutationCount = $derived(multiplyFactors(slotFactors));
	const combinationCount = $derived(slotPermutationCount / factorialBigInt(effectiveR));
	const duplicateArrangementCount = $derived(factorialBigInt(n) / factorialBigInt(effectiveDuplicateCount));

	const slotFactorsForMode = $derived.by(() => {
		if (mode === 'permutation-replacement') {
			return replacementFactors;
		}
		if (mode === 'permutation-slots' || mode === 'combination') {
			return slotFactors;
		}
		return [];
	});

	const slotCenters = $derived.by(() => {
		const count = slotFactorsForMode.length;
		if (count === 0) {
			return [];
		}

		if (count === 1) {
			return [SVG_WIDTH / 2];
		}

		const left = 66;
		const right = SVG_WIDTH - 66;
		const step = (right - left) / (count - 1);
		return slotFactorsForMode.map((_, index) => left + index * step);
	});

	const multiplyMarkers = $derived.by(() =>
		slotCenters.slice(0, -1).map((center, index) => ({
			id: index,
			x: (center + slotCenters[index + 1]) / 2
		}))
	);

	const duplicateSymbols = $derived.by(() => {
		const tokens: SymbolToken[] = [];
		const duplicateToken = 'D';

		for (let index = 0; index < effectiveDuplicateCount; index += 1) {
			tokens.push({
				id: `d-${index}`,
				label: duplicateToken,
				duplicate: true
			});
		}

		for (let index = effectiveDuplicateCount; index < n; index += 1) {
			tokens.push({
				id: `u-${index}`,
				label: String.fromCharCode(65 + (index - effectiveDuplicateCount)),
				duplicate: false
			});
		}

		return tokens;
	});

	const duplicateTokenCenters = $derived.by(() => {
		const count = duplicateSymbols.length;
		if (count === 0) {
			return [];
		}
		if (count === 1) {
			return [SVG_WIDTH / 2];
		}

		const left = 56;
		const right = SVG_WIDTH - 56;
		const step = (right - left) / (count - 1);
		return duplicateSymbols.map((_, index) => left + index * step);
	});

	const combinationSampleSize = $derived(Math.min(effectiveR, 4));
	const combinationSymbols = $derived.by(() =>
		Array.from({ length: combinationSampleSize }, (_, index) => String.fromCharCode(65 + index))
	);
	const combinationOrders = $derived.by(() => buildPermutations(combinationSymbols));
	const combinationOrdersPreview = $derived(combinationOrders.slice(0, 8));
	const hiddenOrderCount = $derived(Math.max(0, combinationOrders.length - combinationOrdersPreview.length));

	const formulaTex = $derived.by(() => {
		if (mode === 'permutation-replacement') {
			return `${n}^{${effectiveR}}=${replacementCount.toString()}`;
		}
		if (mode === 'permutation-slots') {
			return `{}_nP_r=\\frac{${n}!}{(${n}-${effectiveR})!}=${slotPermutationCount.toString()}`;
		}
		if (mode === 'combination') {
			return `\\binom{${n}}{${effectiveR}}=\\frac{${n}!}{${effectiveR}!(${n}-${effectiveR})!}=${combinationCount.toString()}`;
		}
		return `\\frac{${n}!}{${effectiveDuplicateCount}!}=${duplicateArrangementCount.toString()}`;
	});

	const helperTex = $derived.by(() => {
		if (mode === 'combination') {
			return `\\binom{n}{r}=\\frac{{}_nP_r}{r!}`;
		}
		if (mode === 'duplicates') {
			return `\\frac{n!}{n_1!n_2!\\cdots n_k!}`;
		}
		return '';
	});

	const resultLabel = $derived.by(() => {
		if (mode === 'permutation-replacement') {
			return formatBigInt(replacementCount);
		}
		if (mode === 'permutation-slots') {
			return formatBigInt(slotPermutationCount);
		}
		if (mode === 'combination') {
			return formatBigInt(combinationCount);
		}
		return formatBigInt(duplicateArrangementCount);
	});

	const visualCaption = $derived.by(() => {
		if (mode === 'permutation-replacement') {
			return 'Each slot keeps n choices, so multiply n repeatedly.';
		}
		if (mode === 'permutation-slots') {
			return 'Choices decrease each slot: n, n - 1, ..., n - r + 1.';
		}
		return 'Combinations start with nPr, then divide by all r! reorderings.';
	});

	const modeDescription = $derived.by(() => {
		if (mode === 'permutation-replacement') {
			return 'Order matters and values can repeat.';
		}
		if (mode === 'permutation-slots') {
			return 'Order matters and each value is used at most once.';
		}
		if (mode === 'combination') {
			return 'Order does not matter, so rearrangements are duplicates.';
		}
		return 'Identical symbols cause overcounting, so divide by duplicate factorials.';
	});
</script>

<div class="space-y-4">
	<div class="flex flex-wrap gap-2">
		{#each MODE_OPTIONS as option (option.id)}
			<button
				type="button"
				class={`rounded-full border px-3 py-1 text-xs transition sm:text-sm ${
					mode === option.id
						? 'border-primary/50 bg-primary/15 text-foreground'
						: 'border-border/70 bg-background/70 text-muted-foreground hover:border-primary/30 hover:text-foreground'
				}`}
				onclick={() => (mode = option.id)}
			>
				{option.label}
			</button>
		{/each}
	</div>

	<p class="rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-sm text-muted-foreground">
		{modeDescription}
	</p>

	<div class="grid gap-3 sm:grid-cols-3">
		<label class="space-y-1 rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-xs font-medium text-muted-foreground">
			Distinct values n
			<input
				type="range"
				min="2"
				max="10"
				step="1"
				bind:value={n}
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
			/>
			<span class="text-sm font-semibold text-foreground">{n}</span>
		</label>

		{#if mode === 'duplicates'}
			<label class="space-y-1 rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-xs font-medium text-muted-foreground">
				Repeated copies m
				<input
					type="range"
					min="1"
					max={n}
					step="1"
					bind:value={duplicateCount}
					class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
				/>
				<span class="text-sm font-semibold text-foreground">{effectiveDuplicateCount}</span>
			</label>
		{:else}
			<label class="space-y-1 rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-xs font-medium text-muted-foreground">
				Slots r
				<input
					type="range"
					min="1"
					max={effectiveRMax}
					step="1"
					bind:value={r}
					class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
				/>
				<span class="text-sm font-semibold text-foreground">{effectiveR}</span>
			</label>
		{/if}

		<div class="space-y-2 rounded-xl border border-border/70 bg-background/70 px-3 py-2">
			<p class="text-xs font-medium text-muted-foreground">Count</p>
			<p class="text-lg font-semibold text-foreground">{resultLabel}</p>
			<MathExpression math={formulaTex} class="text-sm text-foreground" />
			{#if helperTex}
				<MathExpression math={helperTex} class="text-xs text-muted-foreground" />
			{/if}
		</div>
	</div>

	<svg
		viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
		class="h-auto w-full rounded-xl border border-border/70 bg-card/70 text-slate-900 dark:text-slate-100"
		role="img"
		aria-label="Combinatorics slot and duplicate-count visualization"
	>
		<defs>
			<linearGradient id="combinatorics-bg" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0%" stop-color={TOOL_BG_GRADIENT_START}></stop>
				<stop offset="100%" stop-color={TOOL_BG_GRADIENT_END}></stop>
			</linearGradient>
		</defs>

		<rect x="0" y="0" width={SVG_WIDTH} height={SVG_HEIGHT} fill="url(#combinatorics-bg)"></rect>

		{#if mode === 'duplicates'}
			<text x="20" y="36" font-size="14" fill="currentColor">
				Identical values make multiple arrangements collapse into one.
			</text>

			{#each duplicateTokenCenters as center, index (duplicateSymbols[index].id)}
				<circle
					cx={center}
					cy="122"
					r="26"
					fill={duplicateSymbols[index].duplicate ? 'rgba(20,184,166,0.28)' : 'rgba(255,255,255,0.75)'}
					stroke={duplicateSymbols[index].duplicate ? 'rgba(13,148,136,0.92)' : 'rgba(15,23,42,0.72)'}
					stroke-width="2"
				></circle>
				<text
					x={center}
					y="127"
					text-anchor="middle"
					font-size="16"
					font-weight="700"
					fill="currentColor"
				>
					{duplicateSymbols[index].label}
				</text>
			{/each}

			<text x="20" y="198" font-size="13" fill="currentColor">
				Divide by m! to remove repeated copies of the same ordering.
			</text>
		{:else}
			{#each slotCenters as center, index (index)}
				<text x={center} y="72" text-anchor="middle" font-size="12" fill="currentColor">
					Slot {index + 1}
				</text>
				<rect
					x={center - 34}
					y="84"
					width="68"
					height="58"
					rx="12"
					fill="rgba(255,255,255,0.76)"
					stroke="rgba(15,23,42,0.72)"
					stroke-width="1.8"
				></rect>
				<text
					x={center}
					y="119"
					text-anchor="middle"
					font-size="22"
					font-weight="700"
					fill="currentColor"
				>
					{slotFactorsForMode[index]}
				</text>
			{/each}

			{#each multiplyMarkers as marker (marker.id)}
				<text
					x={marker.x}
					y="120"
					text-anchor="middle"
					font-size="21"
					font-weight="700"
					fill="currentColor"
				>
					×
				</text>
			{/each}

			<text x="20" y="198" font-size="13" fill="currentColor">{visualCaption}</text>
		{/if}
	</svg>

	{#if mode === 'combination'}
		<div class="space-y-2 rounded-xl border border-border/70 bg-background/70 px-3 py-3 text-sm text-muted-foreground">
			<p>
				One selected set is
				<span class="font-semibold text-foreground">{`{${combinationSymbols.join(', ')}}`}</span>.
			</p>
			<p>All orderings below represent that same set, so they collapse into one combination.</p>
			<div class="flex flex-wrap gap-1.5">
				{#each combinationOrdersPreview as ordering (ordering)}
					<span class="rounded-md border border-border/70 bg-card/75 px-2 py-1 font-mono text-xs text-foreground">
						{ordering}
					</span>
				{/each}
			</div>
			{#if hiddenOrderCount > 0}
				<p class="text-xs">+ {hiddenOrderCount} more orderings</p>
			{/if}
		</div>
	{/if}
</div>
