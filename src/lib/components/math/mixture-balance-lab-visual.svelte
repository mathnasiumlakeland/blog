<script module lang="ts">
	import type { MathToolMeta } from './tool-meta';
	import { requireInteractiveToolMetaById } from './tool-registry';

	export const toolMeta: MathToolMeta = requireInteractiveToolMetaById('mixture-balance-lab');
</script>

<script lang="ts">
	import MathExpression from '$lib/components/math/math-expression.svelte';
	import { TOOL_BG_GRADIENT_END, TOOL_BG_GRADIENT_START } from './tool-visual-theme';

	const svgWidth = 720;
	const svgHeight = 320;
	const tankWidth = 112;
	const tankHeight = 164;
	const tankTop = 76;
	const initialTankX = 82;
	const addedTankX = 304;
	const finalTankX = 526;
	const plusSymbolX = (initialTankX + tankWidth + addedTankX) / 2;
	const equalSymbolX = (addedTankX + tankWidth + finalTankX) / 2;
	const operatorSymbolY = tankTop + tankHeight / 2 + 6;

	let initialAmount = $state(10);
	let initialPercent = $state(20);
	let addedPercent = $state(15);
	let targetPercent = $state(17);

	const safeInitialAmount = $derived(Math.max(1, Math.min(40, initialAmount)));
	const safeInitialPercent = $derived(Math.max(0, Math.min(80, initialPercent)));
	const safeAddedPercent = $derived(Math.max(0, Math.min(80, addedPercent)));
	const targetPercentLowerBound = $derived(Math.min(safeInitialPercent, safeAddedPercent));
	const targetPercentUpperBound = $derived(Math.max(safeInitialPercent, safeAddedPercent));
	const safeTargetPercent = $derived(
		Math.max(targetPercentLowerBound, Math.min(targetPercentUpperBound, targetPercent))
	);

	function clampTargetPercentToBlendRange() {
		targetPercent = Math.max(targetPercentLowerBound, Math.min(targetPercentUpperBound, targetPercent));
	}

	const initialFraction = $derived(safeInitialPercent / 100);
	const addedFraction = $derived(safeAddedPercent / 100);
	const targetFraction = $derived(safeTargetPercent / 100);

	const denominator = $derived(targetFraction - addedFraction);
	const numerator = $derived(safeInitialAmount * (initialFraction - targetFraction));

	const hasInfiniteSolutions = $derived(
		Math.abs(denominator) < 1e-10 && Math.abs(numerator) < 1e-10
	);
	const hasNoUniqueSolution = $derived(Math.abs(denominator) < 1e-10 && !hasInfiniteSolutions);
	const solvedAddedAmount = $derived(
		hasNoUniqueSolution || hasInfiniteSolutions ? Number.NaN : numerator / denominator
	);
	const hasNonnegativeSolution = $derived(
		Number.isFinite(solvedAddedAmount) && solvedAddedAmount >= 0
	);
	const hasUniqueSolution = $derived(!hasInfiniteSolutions && !hasNoUniqueSolution && hasNonnegativeSolution);
	const finalAmount = $derived(hasUniqueSolution ? safeInitialAmount + solvedAddedAmount : Number.NaN);

	const initialSoluteAmount = $derived(safeInitialAmount * initialFraction);
	const addedSoluteAmount = $derived(hasUniqueSolution ? solvedAddedAmount * addedFraction : Number.NaN);
	const totalInputSolute = $derived(hasUniqueSolution ? initialSoluteAmount + addedSoluteAmount : Number.NaN);
	const totalOutputSolute = $derived(hasUniqueSolution ? finalAmount * targetFraction : Number.NaN);

	const maxShownAmount = $derived(
		hasUniqueSolution
			? Math.max(safeInitialAmount, solvedAddedAmount, finalAmount, 1)
			: Math.max(safeInitialAmount, 1)
	);

	function toFillHeight(amount: number) {
		if (!Number.isFinite(amount) || amount <= 0) return 0;
		return (amount / maxShownAmount) * tankHeight;
	}

	function toSoluteHeight(amount: number, soluteAmount: number) {
		if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(soluteAmount) || soluteAmount < 0) {
			return 0;
		}
		const concentration = Math.max(0, Math.min(1, soluteAmount / amount));
		return toFillHeight(amount) * concentration;
	}

	const initialFillHeight = $derived(toFillHeight(safeInitialAmount));
	const addedFillHeight = $derived(toFillHeight(solvedAddedAmount));
	const finalFillHeight = $derived(toFillHeight(finalAmount));

	const initialSoluteHeight = $derived(toSoluteHeight(safeInitialAmount, initialSoluteAmount));
	const addedSoluteHeight = $derived(toSoluteHeight(solvedAddedAmount, addedSoluteAmount));
	const finalSoluteHeight = $derived(toSoluteHeight(finalAmount, totalOutputSolute));

	function formatValue(value: number, digits = 2) {
		if (!Number.isFinite(value)) {
			return '--';
		}
		return value.toFixed(digits).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
	}

	const generalBalanceEquation =
		'x=\\frac{A_0(p_1-p_t)}{p_t-p_2},\\quad\\text{where }A_0=\\text{starting amount}';
	const weightedAverageEquation = '\\sum A_{\\text{in}}p_{\\text{in}}=\\sum A_{\\text{out}}p_{\\text{out}}';
	const amountConservationEquation = '\\sum A_{\\text{in}}=\\sum A_{\\text{out}}';

	const specificEquation = $derived(
		`${formatValue(safeInitialAmount, 1)}(${initialFraction.toFixed(3)})+x(${addedFraction.toFixed(3)})=(${formatValue(safeInitialAmount, 1)}+x)(${targetFraction.toFixed(3)})`
	);

	const solvedEquation = $derived.by(() => {
		if (!hasUniqueSolution) {
			return 'x=\\text{no nonnegative solution for this setup}';
		}
		return `x\\approx${formatValue(solvedAddedAmount, 2)}`;
	});

	const statusMessage = $derived.by(() => {
		if (hasInfiniteSolutions) {
			return 'Both mixtures already match the target percent, so any added amount works.';
		}
		if (hasNoUniqueSolution) {
			return 'Target percent matches the added mixture, so this setup does not produce one solvable x.';
		}
		if (!hasNonnegativeSolution) {
			return 'This target is outside the blend range for a nonnegative added amount.';
		}
		return `Add about ${formatValue(solvedAddedAmount, 2)} cups. The final amount is ${formatValue(finalAmount, 2)} cups.`;
	});

</script>

<div class="space-y-4">
	<div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
		<div class="space-y-2 rounded-xl border border-border/70 bg-background/75 p-3">
			<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Core setup</p>
			<MathExpression math={weightedAverageEquation} class="text-sm text-foreground" />
			<MathExpression math={amountConservationEquation} class="text-sm text-foreground" />
			<MathExpression math={generalBalanceEquation} class="text-sm text-muted-foreground" />
		</div>
		<div class="space-y-2 rounded-xl border border-border/70 bg-background/75 p-3">
			<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Current equation</p>
			<MathExpression math={specificEquation} class="text-sm text-foreground" />
			<MathExpression math={solvedEquation} class="text-sm font-semibold text-foreground" />
			<p class="text-xs text-muted-foreground">{statusMessage}</p>
		</div>
	</div>

	<svg
		viewBox={`0 0 ${svgWidth} ${svgHeight}`}
		class="h-auto w-full rounded-xl border border-border/70 bg-card/70 text-slate-900 dark:text-slate-100"
		role="img"
		aria-label="Mixture tanks showing initial, added, and final concentration balance"
	>
		<defs>
			<linearGradient id="mixture-bg" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0%" stop-color={TOOL_BG_GRADIENT_START}></stop>
				<stop offset="100%" stop-color={TOOL_BG_GRADIENT_END}></stop>
			</linearGradient>
		</defs>

		<rect x="0" y="0" width={svgWidth} height={svgHeight} fill="url(#mixture-bg)"></rect>
		<rect x="0" y="0" width={svgWidth} height={svgHeight} fill="rgba(255,255,255,0.6)"></rect>

		<text x="138" y="46" font-size="14" text-anchor="middle" fill="currentColor">Initial mixture</text>
		<text x="360" y="46" font-size="14" text-anchor="middle" fill="currentColor">Added mixture</text>
		<text x="582" y="46" font-size="14" text-anchor="middle" fill="currentColor">Final mixture</text>

		<text x={plusSymbolX} y={operatorSymbolY} font-size="36" text-anchor="middle" fill="rgba(15,23,42,0.8)">
			+
		</text>
		<text x={equalSymbolX} y={operatorSymbolY} font-size="36" text-anchor="middle" fill="rgba(15,23,42,0.8)">
			=
		</text>

		<rect
			x={initialTankX}
			y={tankTop}
			width={tankWidth}
			height={tankHeight}
			rx="12"
			fill="rgba(248,250,252,0.72)"
			stroke="rgba(15,23,42,0.28)"
			stroke-width="2"
		></rect>
		<rect
			x={addedTankX}
			y={tankTop}
			width={tankWidth}
			height={tankHeight}
			rx="12"
			fill="rgba(248,250,252,0.72)"
			stroke="rgba(15,23,42,0.28)"
			stroke-width="2"
		></rect>
		<rect
			x={finalTankX}
			y={tankTop}
			width={tankWidth}
			height={tankHeight}
			rx="12"
			fill="rgba(248,250,252,0.72)"
			stroke="rgba(15,23,42,0.28)"
			stroke-width="2"
		></rect>

		<rect
			x={initialTankX + 3}
			y={tankTop + tankHeight - initialFillHeight}
			width={tankWidth - 6}
			height={initialFillHeight}
			rx="8"
			fill="rgba(56,189,248,0.38)"
		></rect>
		<rect
			x={initialTankX + 3}
			y={tankTop + tankHeight - initialSoluteHeight}
			width={tankWidth - 6}
			height={initialSoluteHeight}
			rx="8"
			fill="rgba(14,116,144,0.62)"
		></rect>

		{#if hasUniqueSolution}
			<rect
				x={addedTankX + 3}
				y={tankTop + tankHeight - addedFillHeight}
				width={tankWidth - 6}
				height={addedFillHeight}
				rx="8"
				fill="rgba(45,212,191,0.36)"
			></rect>
			<rect
				x={addedTankX + 3}
				y={tankTop + tankHeight - addedSoluteHeight}
				width={tankWidth - 6}
				height={addedSoluteHeight}
				rx="8"
				fill="rgba(13,148,136,0.64)"
			></rect>

			<rect
				x={finalTankX + 3}
				y={tankTop + tankHeight - finalFillHeight}
				width={tankWidth - 6}
				height={finalFillHeight}
				rx="8"
				fill="rgba(129,140,248,0.34)"
			></rect>
			<rect
				x={finalTankX + 3}
				y={tankTop + tankHeight - finalSoluteHeight}
				width={tankWidth - 6}
				height={finalSoluteHeight}
				rx="8"
				fill="rgba(67,56,202,0.62)"
			></rect>
		{/if}

		<text x="138" y="266" font-size="13" text-anchor="middle" fill="currentColor">
			{formatValue(safeInitialAmount, 2)} cups at {formatValue(safeInitialPercent, 1)}%
		</text>

		<text x="360" y="266" font-size="13" text-anchor="middle" fill="currentColor">
			{#if hasUniqueSolution}
				{formatValue(solvedAddedAmount, 2)} cups at {formatValue(safeAddedPercent, 1)}%
			{:else}
				x cups at {formatValue(safeAddedPercent, 1)}%
			{/if}
		</text>

		<text x="582" y="266" font-size="13" text-anchor="middle" fill="currentColor">
			{#if hasUniqueSolution}
				{formatValue(finalAmount, 2)} cups at {formatValue(safeTargetPercent, 1)}%
			{:else}
				Target {formatValue(safeTargetPercent, 1)}%
			{/if}
		</text>

		<text x="138" y="286" font-size="12" text-anchor="middle" fill="rgba(15,23,42,0.75)">
			Solute: {formatValue(initialSoluteAmount, 3)} cup-units
		</text>
		<text x="360" y="286" font-size="12" text-anchor="middle" fill="rgba(15,23,42,0.75)">
			{#if hasUniqueSolution}
				Solute: {formatValue(addedSoluteAmount, 3)} cup-units
			{:else}
				Solve for x to fill this tank
			{/if}
		</text>
		<text x="582" y="286" font-size="12" text-anchor="middle" fill="rgba(15,23,42,0.75)">
			{#if hasUniqueSolution}
				Solute: {formatValue(totalOutputSolute, 3)} cup-units
			{:else}
				Output balance pending
			{/if}
		</text>
	</svg>

	{#if hasUniqueSolution}
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
			<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-xs text-muted-foreground">
				Input solute total:
				<span class="ml-1 font-semibold text-foreground">{formatValue(totalInputSolute, 3)}</span>
			</p>
			<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-xs text-muted-foreground">
				Output solute total:
				<span class="ml-1 font-semibold text-foreground">{formatValue(totalOutputSolute, 3)}</span>
			</p>
			<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-xs text-muted-foreground">
				Amount check:
				<span class="ml-1 font-semibold text-foreground">
					{formatValue(safeInitialAmount + solvedAddedAmount, 2)} = {formatValue(finalAmount, 2)}
				</span>
			</p>
		</div>
	{/if}

	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			Starting amount a (cups): {formatValue(safeInitialAmount, 1)}
			<input
				type="range"
				min="1"
				max="30"
				step="0.5"
				bind:value={initialAmount}
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
			/>
		</label>

		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			Initial percent p1: {formatValue(safeInitialPercent, 1)}%
			<input
				type="range"
				min="0"
				max="60"
				step="0.5"
				bind:value={initialPercent}
				oninput={clampTargetPercentToBlendRange}
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
			/>
		</label>

		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			Added percent p2: {formatValue(safeAddedPercent, 1)}%
			<input
				type="range"
				min="0"
				max="60"
				step="0.5"
				bind:value={addedPercent}
				oninput={clampTargetPercentToBlendRange}
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
			/>
		</label>

		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			Target percent pt: {formatValue(safeTargetPercent, 1)}%
			<input
				type="range"
				min={targetPercentLowerBound}
				max={targetPercentUpperBound}
				step="0.5"
				bind:value={targetPercent}
				oninput={clampTargetPercentToBlendRange}
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
			/>
		</label>
	</div>
</div>
