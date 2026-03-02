<script module lang="ts">
	import type { MathToolMeta } from './tool-meta';
	import { requireInteractiveToolMetaById } from './tool-registry';

	export const toolMeta: MathToolMeta = requireInteractiveToolMetaById('reflection-over-a-vertical-line');
</script>

<script lang="ts">
	import MathExpression from '$lib/components/math/math-expression.svelte';

	const PLOT_MIN = -10;
	const PLOT_MAX = 10;
	const LINE_MIN = -9;
	const LINE_MAX = 9;
	const STEP = 0.5;
	const POINT_HIT_RADIUS = 16;
	const LINE_HIT_HALF_WIDTH = 10;
	const DISTANCE_LABEL_SPLIT_THRESHOLD = 3.5;
	const PLOT_SIZE = 420;
	const PLOT_PADDING = 34;
	const PLOT_INNER_SIZE = PLOT_SIZE - PLOT_PADDING * 2;
	const ticks = Array.from({ length: PLOT_MAX - PLOT_MIN + 1 }, (_, index) => PLOT_MIN + index);
	const majorTicks = [-10, -5, 0, 5, 10];

	let k = $state(0);
	let x = $state(3);
	let y = $state(4);
	let plotSvg: SVGSVGElement | null = $state(null);
	let activeDrag = $state<'point' | 'line' | null>(null);

	const reflectedX = $derived(2 * k - x);
	const distanceToLine = $derived(Math.abs(x - k));
	const xDragMin = $derived(Math.max(PLOT_MIN, 2 * k - PLOT_MAX));
	const xDragMax = $derived(Math.min(PLOT_MAX, 2 * k - PLOT_MIN));

	const lineScreenX = $derived(toScreenX(k));
	const pointScreenX = $derived(toScreenX(x));
	const pointScreenY = $derived(toScreenY(y));
	const reflectedPointScreenX = $derived(toScreenX(reflectedX));
	const showReflectedDistanceLabel = $derived(distanceToLine > DISTANCE_LABEL_SPLIT_THRESHOLD);
	const pointDistanceLabelX = $derived((pointScreenX + lineScreenX) / 2);
	const reflectedDistanceLabelX = $derived((reflectedPointScreenX + lineScreenX) / 2);
	const distanceLabelY = $derived(clamp(pointScreenY + 18, PLOT_PADDING + 16, PLOT_SIZE - PLOT_PADDING - 4));
	const pointLabelOnRight = $derived(pointScreenX >= reflectedPointScreenX);
	const reflectedLabelOnRight = $derived(reflectedPointScreenX >= pointScreenX);
	const pointLabelX = $derived(pointScreenX + (pointLabelOnRight ? 10 : -10));
	const reflectedPointLabelX = $derived(reflectedPointScreenX + (reflectedLabelOnRight ? 10 : -10));
	const pointLabelAnchor = $derived(pointLabelOnRight ? 'start' : 'end');
	const reflectedPointLabelAnchor = $derived(reflectedLabelOnRight ? 'start' : 'end');
	const pointLabelY = $derived(pointScreenY - 8);

	const pointDistanceSummary = $derived.by(
		() => `|${formatNumber(x)} - ${formatNumber(k)}| = ${formatNumber(distanceToLine)}`
	);
	const reflectedDistanceSummary = $derived.by(
		() => `|${formatNumber(reflectedX)} - ${formatNumber(k)}| = ${formatNumber(distanceToLine)}`
	);

	const coordinateSummary = $derived.by(
		() =>
			`P=(${formatNumber(x)}, ${formatNumber(y)}),\\;P'=(${formatNumber(reflectedX)}, ${formatNumber(
				y
			)})`
	);

	const reflectionSummary = $derived.by(
		() => `x'=2k-x=2(${formatNumber(k)})-(${formatNumber(x)})=${formatNumber(reflectedX)}`
	);

	function toScreenX(value: number) {
		return PLOT_PADDING + ((value - PLOT_MIN) / (PLOT_MAX - PLOT_MIN)) * PLOT_INNER_SIZE;
	}

	function toScreenY(value: number) {
		return PLOT_PADDING + ((PLOT_MAX - value) / (PLOT_MAX - PLOT_MIN)) * PLOT_INNER_SIZE;
	}

	function toPlotX(screenX: number) {
		return PLOT_MIN + ((screenX - PLOT_PADDING) / PLOT_INNER_SIZE) * (PLOT_MAX - PLOT_MIN);
	}

	function toPlotY(screenY: number) {
		return PLOT_MAX - ((screenY - PLOT_PADDING) / PLOT_INNER_SIZE) * (PLOT_MAX - PLOT_MIN);
	}

	function clamp(value: number, min: number, max: number) {
		return Math.min(max, Math.max(min, value));
	}

	function snap(value: number) {
		return Math.round(value / STEP) * STEP;
	}

	function pointerToSvgPoint(event: PointerEvent) {
		if (!plotSvg) {
			return null;
		}

		const rect = plotSvg.getBoundingClientRect();
		if (rect.width === 0 || rect.height === 0) {
			return null;
		}

		const rawX = ((event.clientX - rect.left) / rect.width) * PLOT_SIZE;
		const rawY = ((event.clientY - rect.top) / rect.height) * PLOT_SIZE;

		return {
			x: clamp(rawX, PLOT_PADDING, PLOT_SIZE - PLOT_PADDING),
			y: clamp(rawY, PLOT_PADDING, PLOT_SIZE - PLOT_PADDING)
		};
	}

	function updateFromPointer(event: PointerEvent) {
		const svgPoint = pointerToSvgPoint(event);
		if (!svgPoint || !activeDrag) {
			return;
		}

		if (activeDrag === 'line') {
			const nextK = snap(clamp(toPlotX(svgPoint.x), LINE_MIN, LINE_MAX));
			k = nextK;
			const nextXMin = Math.max(PLOT_MIN, 2 * nextK - PLOT_MAX);
			const nextXMax = Math.min(PLOT_MAX, 2 * nextK - PLOT_MIN);
			x = clamp(x, nextXMin, nextXMax);
			return;
		}

		x = snap(clamp(toPlotX(svgPoint.x), xDragMin, xDragMax));
		y = snap(clamp(toPlotY(svgPoint.y), PLOT_MIN, PLOT_MAX));
	}

	function handlePlotPointerDown(event: PointerEvent) {
		const svgPoint = pointerToSvgPoint(event);
		if (!svgPoint) {
			return;
		}

		const nearPoint =
			Math.hypot(svgPoint.x - pointScreenX, svgPoint.y - pointScreenY) <= POINT_HIT_RADIUS;
		const nearLine = Math.abs(svgPoint.x - lineScreenX) <= LINE_HIT_HALF_WIDTH;

		if (!nearPoint && !nearLine) {
			return;
		}

		event.preventDefault();
		activeDrag = nearPoint ? 'point' : 'line';
		plotSvg?.setPointerCapture(event.pointerId);
		updateFromPointer(event);
	}

	function handlePlotPointerMove(event: PointerEvent) {
		if (!activeDrag) {
			return;
		}
		event.preventDefault();
		updateFromPointer(event);
	}

	function stopDrag(event: PointerEvent) {
		if (!activeDrag) {
			return;
		}
		activeDrag = null;
		if (plotSvg?.hasPointerCapture(event.pointerId)) {
			plotSvg.releasePointerCapture(event.pointerId);
		}
	}

	function formatNumber(value: number) {
		return Number.isInteger(value) ? value.toString() : value.toFixed(1);
	}
</script>

<div class="space-y-4 select-none">
	<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
		<p class="rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
			Reflection line:
			<MathExpression math={`x=${formatNumber(k)}`} class="ml-1 font-semibold text-foreground" />
		</p>
		<p class="rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
			Coordinates:
			<MathExpression math={coordinateSummary} class="ml-1 font-semibold text-foreground" />
		</p>
		<p class="rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
			Reflected x-value:
			<MathExpression math={reflectionSummary} class="ml-1 font-semibold text-foreground" />
		</p>
	</div>

	<svg
		bind:this={plotSvg}
		viewBox={`0 0 ${PLOT_SIZE} ${PLOT_SIZE}`}
		class="w-full rounded-xl border border-border/70 bg-white select-none touch-none"
		role="img"
		aria-label="Coordinate graph showing reflection across x equals k"
		onpointerdown={handlePlotPointerDown}
		onpointermove={handlePlotPointerMove}
		onpointerup={stopDrag}
		onpointercancel={stopDrag}
	>
		<rect x={PLOT_PADDING} y={PLOT_PADDING} width={PLOT_INNER_SIZE} height={PLOT_INNER_SIZE} fill="white" />

		{#each ticks as tick (tick)}
			<line
				x1={toScreenX(tick)}
				y1={PLOT_PADDING}
				x2={toScreenX(tick)}
				y2={PLOT_SIZE - PLOT_PADDING}
				stroke={tick === 0 ? '#64748b' : '#e2e8f0'}
				stroke-width={tick === 0 ? 1.3 : 1}
			/>
			<line
				x1={PLOT_PADDING}
				y1={toScreenY(tick)}
				x2={PLOT_SIZE - PLOT_PADDING}
				y2={toScreenY(tick)}
				stroke={tick === 0 ? '#64748b' : '#e2e8f0'}
				stroke-width={tick === 0 ? 1.3 : 1}
			/>
		{/each}

		<line
			x1={lineScreenX}
			y1={PLOT_PADDING}
			x2={lineScreenX}
			y2={PLOT_SIZE - PLOT_PADDING}
			stroke="#0f766e"
			stroke-width="2.5"
		/>
		<line
			x1={lineScreenX}
			y1={PLOT_PADDING}
			x2={lineScreenX}
			y2={PLOT_SIZE - PLOT_PADDING}
			stroke="transparent"
			stroke-width="18"
			style="cursor: ew-resize;"
		/>

		<line
			x1={pointScreenX}
			y1={pointScreenY}
			x2={lineScreenX}
			y2={pointScreenY}
			stroke="#0f172a"
			stroke-dasharray="5 4"
			stroke-width="1.5"
		/>
		<line
			x1={lineScreenX}
			y1={pointScreenY}
			x2={reflectedPointScreenX}
			y2={pointScreenY}
			stroke="#0f172a"
			stroke-dasharray="5 4"
			stroke-width="1.5"
		/>
		<text
			x={pointDistanceLabelX}
			y={distanceLabelY}
			class="fill-slate-700 text-[10px] font-semibold"
			stroke="white"
			stroke-width="3"
			paint-order="stroke"
			stroke-linejoin="round"
			text-anchor="middle"
		>
			{pointDistanceSummary}
		</text>
		{#if showReflectedDistanceLabel}
			<text
				x={reflectedDistanceLabelX}
				y={distanceLabelY}
				class="fill-slate-700 text-[10px] font-semibold"
				stroke="white"
				stroke-width="3"
				paint-order="stroke"
				stroke-linejoin="round"
				text-anchor="middle"
			>
				{reflectedDistanceSummary}
			</text>
		{/if}

		<circle
			cx={pointScreenX}
			cy={pointScreenY}
			r="14"
			fill="transparent"
			style="cursor: grab;"
		/>
		<circle cx={pointScreenX} cy={pointScreenY} r="6" fill="#2563eb" style="cursor: grab;" />
		<circle cx={reflectedPointScreenX} cy={pointScreenY} r="6" fill="#0f766e" />

		<text
			x={pointLabelX}
			y={pointLabelY}
			text-anchor={pointLabelAnchor}
			class="fill-slate-800 text-[11px] font-semibold"
		>
			P({formatNumber(x)}, {formatNumber(y)})
		</text>
		<text
			x={reflectedPointLabelX}
			y={pointLabelY}
			text-anchor={reflectedPointLabelAnchor}
			class="fill-slate-800 text-[11px] font-semibold"
		>
			P'({formatNumber(reflectedX)}, {formatNumber(y)})
		</text>

		<text x={lineScreenX + 8} y={PLOT_PADDING + 14} class="fill-teal-700 text-[11px] font-semibold">
			x = {formatNumber(k)}
		</text>

		{#each majorTicks as tick (tick)}
			<text
				x={toScreenX(tick)}
				y={PLOT_SIZE - PLOT_PADDING + 16}
				text-anchor="middle"
				class="fill-slate-500 text-[10px]"
			>
				{tick}
			</text>
			<text
				x={PLOT_PADDING - 12}
				y={toScreenY(tick) + 3}
				text-anchor="end"
				class="fill-slate-500 text-[10px]"
			>
				{tick}
			</text>
		{/each}
	</svg>

	<p class="text-xs text-muted-foreground">
		Drag the blue point or the vertical line directly on the plot.
	</p>
</div>
