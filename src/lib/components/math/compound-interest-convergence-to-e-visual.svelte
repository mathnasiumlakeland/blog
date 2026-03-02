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
	const eValue = Math.E;

	let maxN = $state(600);
	let selectedN = $state(365);

	const safeMaxN = $derived(Math.max(10, Math.min(5000, Math.round(maxN))));
	const safeSelectedN = $derived(Math.max(1, Math.min(safeMaxN, Math.round(selectedN))));
	const yMin = 1.95;
	const yMax = 2.75;
	const innerWidth = PLOT_WIDTH - PAD_LEFT - PAD_RIGHT;
	const innerHeight = PLOT_HEIGHT - PAD_TOP - PAD_BOTTOM;

	const yTicks = [2, 2.2, 2.4, 2.6];

	function valueForN(n: number) {
		return Math.pow(1 + 1 / n, n);
	}

	function toPlotX(n: number, maxNValue: number) {
		if (maxNValue <= 1) {
			return PAD_LEFT;
		}
		return PAD_LEFT + ((n - 1) / (maxNValue - 1)) * innerWidth;
	}

	function toPlotY(value: number) {
		return PAD_TOP + ((yMax - value) / (yMax - yMin)) * innerHeight;
	}

	function formatFixed(value: number, digits = 6) {
		return value.toFixed(digits);
	}

	function makeXTicks(maxNValue: number) {
		const rawTicks = [
			1,
			Math.round(1 + 0.25 * (maxNValue - 1)),
			Math.round(1 + 0.5 * (maxNValue - 1)),
			Math.round(1 + 0.75 * (maxNValue - 1)),
			maxNValue
		];

		return [...new Set(rawTicks)].sort((left, right) => left - right);
	}

	const xTicks = $derived(makeXTicks(safeMaxN));

	const curvePoints = $derived.by(() => {
		const maxSamples = Math.min(safeMaxN, 420);
		const points: string[] = [];
		let previousN = -1;

		for (let index = 0; index < maxSamples; index += 1) {
			const ratio = maxSamples === 1 ? 0 : index / (maxSamples - 1);
			const n = Math.max(1, Math.round(1 + ratio * (safeMaxN - 1)));
			if (n === previousN) {
				continue;
			}
			previousN = n;
			points.push(`${toPlotX(n, safeMaxN)},${toPlotY(valueForN(n))}`);
		}

		return points.join(' ');
	});

	const selectedValue = $derived(valueForN(safeSelectedN));
	const selectedGap = $derived(Math.abs(eValue - selectedValue));
	const selectedX = $derived(toPlotX(safeSelectedN, safeMaxN));
	const selectedY = $derived(toPlotY(selectedValue));
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
				x1={toPlotX(tick, safeMaxN)}
				y1={PAD_TOP}
				x2={toPlotX(tick, safeMaxN)}
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
			stroke="#334155"
			stroke-width="1.5"
			stroke-dasharray="7 6"
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
			stroke="#0f766e"
			stroke-width="2.8"
			stroke-linejoin="round"
			stroke-linecap="round"
		/>

		<line
			x1={selectedX}
			y1={selectedY}
			x2={selectedX}
			y2={PLOT_HEIGHT - PAD_BOTTOM}
			stroke="#0f766e"
			stroke-width="1.2"
			stroke-dasharray="4 4"
		/>
		<circle cx={selectedX} cy={selectedY} r="4.5" fill="#0f766e"></circle>

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
			class="fill-slate-700 text-[11px] font-semibold"
			text-anchor="end"
		>
			e
		</text>

		{#each xTicks as tick (tick)}
			<text
				x={toPlotX(tick, safeMaxN)}
				y={PLOT_HEIGHT - PAD_BOTTOM + 16}
				class="fill-slate-600 text-[11px]"
				text-anchor="middle"
			>
				{tick}
			</text>
		{/each}

		<text
			x={PLOT_WIDTH - PAD_RIGHT - 6}
			y={toPlotY(eValue) - 8}
			class="fill-slate-700 text-[11px] font-semibold"
			text-anchor="end"
		>
			y = e (dotted)
		</text>

		<text
			x={(PAD_LEFT + (PLOT_WIDTH - PAD_RIGHT)) / 2}
			y={PLOT_HEIGHT - 12}
			class="fill-slate-700 text-[12px]"
			text-anchor="middle"
		>
			n
		</text>
		<text
			x="16"
			y={(PAD_TOP + (PLOT_HEIGHT - PAD_BOTTOM)) / 2}
			class="fill-slate-700 text-[12px]"
			text-anchor="middle"
			transform={`rotate(-90 16 ${(PAD_TOP + (PLOT_HEIGHT - PAD_BOTTOM)) / 2})`}
		>
			A_n
		</text>
	</svg>

	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			Maximum n on x-axis: {safeMaxN}
			<input
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
				type="range"
				min="10"
				max="5000"
				step="10"
				bind:value={maxN}
			/>
		</label>

		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			Selected n: {safeSelectedN}
			<input
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
				type="range"
				min="1"
				max={safeMaxN}
				step="1"
				bind:value={selectedN}
			/>
		</label>
	</div>
</div>
