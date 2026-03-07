<script module lang="ts">
	import type { MathToolMeta } from './tool-meta';
	import { requireInteractiveToolMetaById } from './tool-registry';

	export const toolMeta: MathToolMeta = requireInteractiveToolMetaById('compound-interest-growth');
</script>

<script lang="ts">
	import MathExpression from '$lib/components/math/math-expression.svelte';

	const PLOT_WIDTH = 700;
	const PLOT_HEIGHT = 380;
	const PAD_LEFT = 70;
	const PAD_RIGHT = 24;
	const PAD_TOP = 24;
	const PAD_BOTTOM = 54;
	const X_AXIS_MIN = 0;
	const X_AXIS_MAX = 30;
	const Y_AXIS_MIN = 0;
	const BASE_Y_AXIS_MAX = 50000;
	const Y_TICK_COUNT = 5;
	const innerWidth = PLOT_WIDTH - PAD_LEFT - PAD_RIGHT;
	const innerHeight = PLOT_HEIGHT - PAD_TOP - PAD_BOTTOM;
	const xRange = X_AXIS_MAX - X_AXIS_MIN;

	let principal = $state(2000);
	let annualRatePercent = $state(12);
	let compoundsPerYear = $state(12);
	let selectedYear = $state(25);

	const safePrincipal = $derived(Math.max(100, Math.min(2000, Math.round(principal))));
	const safeAnnualRatePercent = $derived(Math.max(0, Math.min(30, annualRatePercent)));
	const safeCompoundsPerYear = $derived(Math.max(1, Math.min(365, Math.round(compoundsPerYear))));
	const safeSelectedYear = $derived(Math.max(X_AXIS_MIN, Math.min(X_AXIS_MAX, selectedYear)));
	const annualRateDecimal = $derived(safeAnnualRatePercent / 100);
	const ratePerPeriod = $derived(annualRateDecimal / safeCompoundsPerYear);

	function valueAt(timeYears: number) {
		return safePrincipal * (1 + ratePerPeriod) ** (safeCompoundsPerYear * timeYears);
	}

	function formatCompact(value: number, digits = 2) {
		return value.toFixed(digits).replace(/\.?0+$/, '');
	}

	function formatCurrency(value: number) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 2
		}).format(value);
	}

	function formatAxisValue(value: number) {
		const normalized = Math.abs(value) < 1e-9 ? 0 : value;
		const absValue = Math.abs(normalized);
		let maxFractionDigits = 2;
		if (absValue >= 1000) {
			maxFractionDigits = 0;
		} else if (absValue >= 100) {
			maxFractionDigits = 1;
		}
		return new Intl.NumberFormat('en-US', {
			maximumFractionDigits: maxFractionDigits
		}).format(normalized);
	}

	function clamp(value: number, minValue: number, maxValue: number) {
		return Math.min(maxValue, Math.max(minValue, value));
	}

	function toPlotX(timeYears: number) {
		const clampedTime = clamp(timeYears, X_AXIS_MIN, X_AXIS_MAX);
		return PAD_LEFT + ((clampedTime - X_AXIS_MIN) / xRange) * innerWidth;
	}

	function toPlotY(amount: number) {
		const clampedAmount = clamp(amount, Y_AXIS_MIN, yAxisMax);
		return PAD_TOP + ((yAxisMax - clampedAmount) / yRange) * innerHeight;
	}
	const xTicks = [0, 5, 10, 15, 20, 25, 30];
	const plottedHorizonYears = X_AXIS_MAX;
	const plottedMaxAmount = $derived(
		Math.max(safePrincipal, valueAt(plottedHorizonYears), valueAt(safeSelectedYear))
	);
	const yAxisMax = $derived(Math.max(BASE_Y_AXIS_MAX, plottedMaxAmount * 1.12));
	const yRange = $derived(Math.max(1, yAxisMax - Y_AXIS_MIN));
	const yTicks = $derived.by(() => {
		const tickStep = yAxisMax / Y_TICK_COUNT;
		return Array.from({ length: Y_TICK_COUNT + 1 }, (_, index) => index * tickStep);
	});

	const curvePoints = $derived.by(() => {
		const samples = Math.max(30, Math.min(420, plottedHorizonYears * 20));
		const points: string[] = [];

		for (let index = 0; index < samples; index += 1) {
			const ratio = samples === 1 ? 0 : index / (samples - 1);
			const timeYears = ratio * plottedHorizonYears;
			points.push(`${toPlotX(timeYears)},${toPlotY(valueAt(timeYears))}`);
		}

		return points.join(' ');
	});

	const selectedAmount = $derived(valueAt(safeSelectedYear));
	const selectedInterest = $derived(Math.max(0, selectedAmount - safePrincipal));
	const selectedCompounds = $derived(safeCompoundsPerYear * safeSelectedYear);
	const selectedX = $derived(toPlotX(safeSelectedYear));
	const selectedY = $derived(toPlotY(selectedAmount));
</script>

<div class="space-y-4">
	<div class="tool-summary-grid">
		<p class="tool-summary-card rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Formula:
			<MathExpression
				math={'A=P\\left(1+\\frac{r}{n}\\right)^{nt}'}
				class="ml-1 font-semibold text-foreground"
			/>
		</p>
		<p class="tool-summary-card rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Per-period rate:
			<MathExpression
				math={`\\frac{r}{n}\\approx${formatCompact(ratePerPeriod * 100, 4)}\\%`}
				class="ml-1 font-semibold text-foreground"
			/>
		</p>
		<p class="tool-summary-card rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			At
			<MathExpression math={`t=${formatCompact(safeSelectedYear, 1)}`} class="mx-1 font-semibold text-foreground" />
			years:
			<MathExpression
				math={`A\\approx${formatCompact(selectedAmount, 2)}`}
				class="ml-1 font-semibold text-foreground"
			/>
		</p>
	</div>

	<svg
		viewBox={`0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`}
		class="h-auto w-full rounded-xl border border-border/70 bg-white"
		role="img"
		aria-label="Compound interest growth graph"
	>
		<rect x={PAD_LEFT} y={PAD_TOP} width={innerWidth} height={innerHeight} fill="white"></rect>

		{#each yTicks as tick (tick)}
			<line
				x1={PAD_LEFT}
				y1={toPlotY(tick)}
				x2={PLOT_WIDTH - PAD_RIGHT}
				y2={toPlotY(tick)}
				stroke="#e2e8f0"
				stroke-width="1"
			/>
			<text
				x={PAD_LEFT - 10}
				y={toPlotY(tick) + 4}
				class="fill-slate-600 text-[11px]"
				text-anchor="end"
			>
				{formatAxisValue(tick)}
			</text>
		{/each}

		{#each xTicks as tick (tick)}
			<line
				x1={toPlotX(tick)}
				y1={PAD_TOP}
				x2={toPlotX(tick)}
				y2={PLOT_HEIGHT - PAD_BOTTOM}
				stroke="#e2e8f0"
				stroke-width="1"
			/>
			<text
				x={toPlotX(tick)}
				y={PLOT_HEIGHT - PAD_BOTTOM + 16}
				class="fill-slate-600 text-[11px]"
				text-anchor="middle"
			>
				{formatAxisValue(tick)}
			</text>
		{/each}

		<line
			x1={PAD_LEFT}
			y1={PLOT_HEIGHT - PAD_BOTTOM}
			x2={PLOT_WIDTH - PAD_RIGHT}
			y2={PLOT_HEIGHT - PAD_BOTTOM}
			stroke="#64748b"
			stroke-width="1.4"
		/>
		<line
			x1={PAD_LEFT}
			y1={PAD_TOP}
			x2={PAD_LEFT}
			y2={PLOT_HEIGHT - PAD_BOTTOM}
			stroke="#64748b"
			stroke-width="1.4"
		/>

		<polyline
			points={curvePoints}
			fill="none"
			stroke="#0e7490"
			stroke-width="2.8"
			stroke-linejoin="round"
			stroke-linecap="round"
		/>

		<line
			x1={selectedX}
			y1={selectedY}
			x2={selectedX}
			y2={PLOT_HEIGHT - PAD_BOTTOM}
			stroke="#0e7490"
			stroke-width="1.2"
			stroke-dasharray="4 4"
		/>
		<circle cx={selectedX} cy={selectedY} r="4.5" fill="#0e7490"></circle>

		<text
			x={PLOT_WIDTH - PAD_RIGHT - 6}
			y={selectedY - 8}
			class="fill-slate-700 text-[11px] font-semibold"
			text-anchor="end"
		>
			{formatCurrency(selectedAmount)}
		</text>

		<text
			x={(PAD_LEFT + (PLOT_WIDTH - PAD_RIGHT)) / 2}
			y={PLOT_HEIGHT - 12}
			class="fill-slate-700 text-[12px]"
			text-anchor="middle"
		>
			t (years)
		</text>
		<text
			x="18"
			y={(PAD_TOP + (PLOT_HEIGHT - PAD_BOTTOM)) / 2}
			class="fill-slate-700 text-[12px]"
			text-anchor="middle"
			transform={`rotate(-90 18 ${(PAD_TOP + (PLOT_HEIGHT - PAD_BOTTOM)) / 2})`}
		>
			A(t)
		</text>
	</svg>

	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			Principal
			<MathExpression math="P" class="mx-0.5 inline-block text-foreground" />:
			{formatCurrency(safePrincipal)}
			<input
				type="range"
				min="100"
				max="2000"
				step="100"
				bind:value={principal}
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
			/>
		</label>

		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			Annual rate
			<MathExpression math="r" class="mx-0.5 inline-block text-foreground" />:
			{safeAnnualRatePercent.toFixed(2)}%
			<input
				type="range"
				min="0"
				max="30"
				step="0.1"
				bind:value={annualRatePercent}
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
			/>
		</label>

		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			Compounds per year
			<MathExpression math="n" class="mx-0.5 inline-block text-foreground" />:
			{safeCompoundsPerYear}
			<input
				type="range"
				min="1"
				max="365"
				step="1"
				bind:value={compoundsPerYear}
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
			/>
		</label>

		<label class="space-y-1 text-xs font-medium text-muted-foreground sm:col-span-2">
			Selected year: {formatCompact(safeSelectedYear, 1)} (total compounds:
			{formatCompact(selectedCompounds, 1)})
			<input
				type="range"
				min={X_AXIS_MIN}
				max={X_AXIS_MAX}
				step="0.1"
				bind:value={selectedYear}
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
			/>
		</label>
	</div>

	<p class="text-xs text-muted-foreground">
		Interest earned by selected year: <span class="font-semibold text-foreground">{formatCurrency(selectedInterest)}</span>
	</p>
</div>
