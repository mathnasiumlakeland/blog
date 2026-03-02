<script module lang="ts">
	import type { MathToolMeta } from './tool-meta';
	import { requireInteractiveToolMetaById } from './tool-registry';

	export const toolMeta: MathToolMeta = requireInteractiveToolMetaById(
		'compound-interest-convergence-to-e'
	);
</script>

<script lang="ts">
	import InlineMathText from '$lib/components/math/inline-math-text.svelte';
	import MathExpression from '$lib/components/math/math-expression.svelte';

	const PLOT_WIDTH = 700;
	const PLOT_HEIGHT = 380;
	const PAD_LEFT = 58;
	const PAD_RIGHT = 24;
	const PAD_TOP = 24;
	const PAD_BOTTOM = 52;
	const CURVE_COLOR = '#0e7490';
	const REFERENCE_COLOR = '#0e7490';
	const X_AXIS_MIN_N = 1;
	const X_AXIS_MAX_N = 250;
	const eValue = Math.E;

	let selectedN = $state(50);

	const safeSelectedN = $derived(Math.max(X_AXIS_MIN_N, Math.min(X_AXIS_MAX_N, Math.round(selectedN))));
	const yMin = 1.95;
	const yMax = 2.8;
	const innerWidth = PLOT_WIDTH - PAD_LEFT - PAD_RIGHT;
	const innerHeight = PLOT_HEIGHT - PAD_TOP - PAD_BOTTOM;

	const yTicks = [2, 2.2, 2.4, 2.6, 2.8];

	function valueForN(n: number) {
		return Math.pow(1 + 1 / n, n);
	}

	function toPlotX(n: number) {
		if (X_AXIS_MAX_N <= X_AXIS_MIN_N) {
			return PAD_LEFT;
		}
		return PAD_LEFT + ((n - X_AXIS_MIN_N) / (X_AXIS_MAX_N - X_AXIS_MIN_N)) * innerWidth;
	}

	function toPlotY(value: number) {
		return PAD_TOP + ((yMax - value) / (yMax - yMin)) * innerHeight;
	}

	function formatFixed(value: number, digits = 6) {
		return value.toFixed(digits);
	}

	const xTicks = [1, 50, 100, 150, 200, 250];

	const curvePoints = $derived.by(() => {
		const points: string[] = [];

		for (let n = X_AXIS_MIN_N; n <= X_AXIS_MAX_N; n += 1) {
			points.push(`${toPlotX(n)},${toPlotY(valueForN(n))}`);
		}

		return points.join(' ');
	});

	const selectedValue = $derived(valueForN(safeSelectedN));
	const selectedGap = $derived(Math.abs(eValue - selectedValue));
	const selectedX = $derived(toPlotX(safeSelectedN));
	const selectedY = $derived(toPlotY(selectedValue));
	const selectedValueLabelY = $derived(Math.max(PAD_TOP + 14, selectedY - 10));
</script>

<div class="space-y-4">
	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Sequence:
			<MathExpression
				math={'A_n=\\left(1+\\frac{1}{n}\\right)^n'}
				class="ml-1 font-semibold text-foreground"
			/>
		</p>
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Selected approximation:
			<MathExpression
				math={`A_{${safeSelectedN}}\\approx ${formatFixed(selectedValue)}`}
				class="ml-1 font-semibold text-foreground"
			/>
		</p>
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			<InlineMathText text="Distance to $e$:" />
			<MathExpression
				math={`\\left|e-A_{${safeSelectedN}}\\right|\\approx ${formatFixed(selectedGap)}`}
				class="ml-1 font-semibold text-foreground"
			/>
		</p>
	</div>

	<svg
		viewBox={`0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`}
		class="h-auto w-full rounded-xl border border-border/70 bg-white"
		role="img"
		aria-label="Plot of A_n = (1 + 1/n)^n showing convergence toward e as n increases"
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
		{/each}

		<line
			x1={PAD_LEFT}
			y1={toPlotY(eValue)}
			x2={PLOT_WIDTH - PAD_RIGHT}
			y2={toPlotY(eValue)}
			stroke={REFERENCE_COLOR}
			stroke-opacity="0.58"
			stroke-width="1.5"
			stroke-dasharray="6 5"
		/>

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
			stroke={CURVE_COLOR}
			stroke-width="2.8"
			stroke-linejoin="round"
			stroke-linecap="round"
		/>

		<line
			x1={selectedX}
			y1={selectedY}
			x2={selectedX}
			y2={PLOT_HEIGHT - PAD_BOTTOM}
			stroke={CURVE_COLOR}
			stroke-width="1.2"
			stroke-dasharray="4 4"
		/>
		<circle cx={selectedX} cy={selectedY} r="4.5" fill={CURVE_COLOR}></circle>
		<text
			x={selectedX}
			y={selectedValueLabelY}
			class="text-[11px] font-semibold"
			fill={CURVE_COLOR}
			text-anchor="middle"
		>
			{formatFixed(selectedValue, 3)}
		</text>

		{#each yTicks as tick (tick)}
			<text
				x={PAD_LEFT - 10}
				y={toPlotY(tick) + 4}
				class="fill-slate-600 text-[11px]"
				text-anchor="end"
			>
				{tick.toFixed(1)}
			</text>
		{/each}
		<text
			x={PAD_LEFT - 10}
			y={toPlotY(eValue) + 4}
			class="text-[11px] font-semibold"
			fill={REFERENCE_COLOR}
			text-anchor="end"
		>
			e ≈ 2.72
		</text>

		{#each xTicks as tick (tick)}
			<text
				x={toPlotX(tick)}
				y={PLOT_HEIGHT - PAD_BOTTOM + 16}
				class="fill-slate-600 text-[11px]"
				text-anchor="middle"
			>
				{tick}
			</text>
		{/each}

		<text
			x={(PAD_LEFT + (PLOT_WIDTH - PAD_RIGHT)) / 2}
			y={PLOT_HEIGHT - 12}
			class="fill-slate-700 text-[12px]"
			text-anchor="middle"
		>
			n
		</text>
		<foreignObject
			x="4"
			y={(PAD_TOP + (PLOT_HEIGHT - PAD_BOTTOM)) / 2 - 40}
			width="24"
			height="80"
			transform={`rotate(-90 16 ${(PAD_TOP + (PLOT_HEIGHT - PAD_BOTTOM)) / 2})`}
		>
			<div xmlns="http://www.w3.org/1999/xhtml" class="flex h-full w-full items-center justify-center">
				<MathExpression math="A_n" class="text-[12px] text-slate-700" />
			</div>
		</foreignObject>
	</svg>

	<div class="grid grid-cols-1 gap-3">
		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			n: {safeSelectedN}
			<input
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
				type="range"
				min={X_AXIS_MIN_N}
				max={X_AXIS_MAX_N}
				step="1"
				bind:value={selectedN}
			/>
		</label>
	</div>
</div>
