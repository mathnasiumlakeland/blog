<script module lang="ts">
	import type { MathToolMeta } from './tool-meta';
	import { requireInteractiveToolMetaById } from './tool-registry';

	export const toolMeta: MathToolMeta = requireInteractiveToolMetaById(
		'continuous-compounding-growth'
	);
</script>

<script lang="ts">
	import MathExpression from '$lib/components/math/math-expression.svelte';

	const PLOT_WIDTH = 700;
	const PLOT_HEIGHT = 380;
	const PAD_LEFT = 70;
	const PAD_RIGHT = 24;
	const PAD_TOP = 24;
	const PAD_BOTTOM = 54;
	const innerWidth = PLOT_WIDTH - PAD_LEFT - PAD_RIGHT;
	const innerHeight = PLOT_HEIGHT - PAD_TOP - PAD_BOTTOM;

	let principal = $state(2000);
	let annualRatePercent = $state(4.5);
	let horizonYears = $state(25);
	let selectedYear = $state(10);

	const safePrincipal = $derived(Math.max(100, Math.min(50000, Math.round(principal))));
	const safeAnnualRatePercent = $derived(Math.max(0, Math.min(30, annualRatePercent)));
	const safeHorizonYears = $derived(Math.max(1, Math.min(50, Math.round(horizonYears))));
	const safeSelectedYear = $derived(Math.max(0, Math.min(safeHorizonYears, selectedYear)));
	const annualRateDecimal = $derived(safeAnnualRatePercent / 100);

	function valueAt(timeYears: number) {
		return safePrincipal * Math.exp(annualRateDecimal * timeYears);
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

	function toPlotX(timeYears: number) {
		return PAD_LEFT + (timeYears / safeHorizonYears) * innerWidth;
	}

	function toPlotY(amount: number) {
		return PAD_TOP + ((yMax - amount) / yMax) * innerHeight;
	}

	function niceStep(value: number) {
		if (value <= 0) {
			return 1;
		}

		const exponent = Math.floor(Math.log10(value));
		const fraction = value / 10 ** exponent;

		let niceFraction = 1;
		if (fraction <= 1) {
			niceFraction = 1;
		} else if (fraction <= 2) {
			niceFraction = 2;
		} else if (fraction <= 5) {
			niceFraction = 5;
		} else {
			niceFraction = 10;
		}

		return niceFraction * 10 ** exponent;
	}

	function makeYTicks(maxAmount: number) {
		const step = niceStep(maxAmount / 4);
		const ceiling = Math.ceil(maxAmount / step) * step;
		const ticks: number[] = [];
		for (let tick = 0; tick <= ceiling + step * 0.5; tick += step) {
			ticks.push(tick);
		}
		return ticks;
	}

	function makeXTicks(maxYears: number) {
		const rawTicks = [0, maxYears * 0.25, maxYears * 0.5, maxYears * 0.75, maxYears];
		return [...new Set(rawTicks.map((tick) => Math.round(tick * 10) / 10))];
	}

	const maxAmount = $derived(Math.max(valueAt(safeHorizonYears), safePrincipal));
	const yTicks = $derived(makeYTicks(Math.max(10, maxAmount * 1.08)));
	const yMax = $derived(yTicks[yTicks.length - 1] ?? 10);
	const xTicks = $derived(makeXTicks(safeHorizonYears));

	const curvePoints = $derived.by(() => {
		const samples = Math.max(30, Math.min(420, safeHorizonYears * 20));
		const points: string[] = [];

		for (let index = 0; index < samples; index += 1) {
			const ratio = samples === 1 ? 0 : index / (samples - 1);
			const timeYears = ratio * safeHorizonYears;
			points.push(`${toPlotX(timeYears)},${toPlotY(valueAt(timeYears))}`);
		}

		return points.join(' ');
	});

	const selectedAmount = $derived(valueAt(safeSelectedYear));
	const selectedInterest = $derived(Math.max(0, selectedAmount - safePrincipal));
	const selectedX = $derived(toPlotX(safeSelectedYear));
	const selectedY = $derived(toPlotY(selectedAmount));
</script>

<div class="space-y-4">
	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Formula:
			<MathExpression math={'A=Pe^{rt}'} class="ml-1 font-semibold text-foreground" />
		</p>
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			At
			<MathExpression math={`t=${formatCompact(safeSelectedYear, 1)}`} class="mx-1 font-semibold text-foreground" />
			years:
			<MathExpression
				math={`A\\approx${formatCompact(selectedAmount, 2)}`}
				class="ml-1 font-semibold text-foreground"
			/>
		</p>
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Interest earned:
			<MathExpression
				math={`A-P\\approx${formatCompact(selectedInterest, 2)}`}
				class="ml-1 font-semibold text-foreground"
			/>
		</p>
	</div>

	<svg
		viewBox={`0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`}
		class="h-auto w-full rounded-xl border border-border/70 bg-white"
		role="img"
		aria-label="Continuously compounded interest growth graph"
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
				{formatCompact(tick, tick >= 1000 ? 0 : 1)}
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
				{formatCompact(tick, 1)}
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
			stroke="#0369a1"
			stroke-width="2.8"
			stroke-linejoin="round"
			stroke-linecap="round"
		/>

		<line
			x1={selectedX}
			y1={selectedY}
			x2={selectedX}
			y2={PLOT_HEIGHT - PAD_BOTTOM}
			stroke="#0369a1"
			stroke-width="1.2"
			stroke-dasharray="4 4"
		/>
		<circle cx={selectedX} cy={selectedY} r="4.5" fill="#0369a1"></circle>

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
			Principal $P$: {formatCurrency(safePrincipal)}
			<input
				type="range"
				min="100"
				max="50000"
				step="100"
				bind:value={principal}
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
			/>
		</label>

		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			Annual rate $r$: {safeAnnualRatePercent.toFixed(2)}%
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
			Horizon (years): {safeHorizonYears}
			<input
				type="range"
				min="1"
				max="50"
				step="1"
				bind:value={horizonYears}
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
			/>
		</label>

		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			Selected year: {formatCompact(safeSelectedYear, 1)}
			<input
				type="range"
				min="0"
				max={safeHorizonYears}
				step="0.1"
				bind:value={selectedYear}
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
			/>
		</label>
	</div>
</div>
