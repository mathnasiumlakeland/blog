<script module lang="ts">
	import type { MathToolMeta } from './tool-meta';
	import { requireInteractiveToolMetaById } from './tool-registry';

	export const toolMeta: MathToolMeta = requireInteractiveToolMetaById('reflection-over-y-equals-x');
</script>

<script lang="ts">
	import MathExpression from '$lib/components/math/math-expression.svelte';

	const PLOT_MIN = -10;
	const PLOT_MAX = 10;
	const STEP = 0.5;
	const POINT_HIT_RADIUS = 16;
	const DISTANCE_LABEL_SPLIT_THRESHOLD = 1.5;
	const PLOT_SIZE = 420;
	const PLOT_PADDING = 34;
	const PLOT_INNER_SIZE = PLOT_SIZE - PLOT_PADDING * 2;
	const ticks = Array.from({ length: PLOT_MAX - PLOT_MIN + 1 }, (_, index) => PLOT_MIN + index);
	const majorTicks = [-10, -5, 0, 5, 10];

	let x = $state(3);
	let y = $state(6);
	let plotSvg: SVGSVGElement | null = $state(null);
	let activeDrag = $state(false);

	const reflectedX = $derived(y);
	const reflectedY = $derived(x);
	const projection = $derived((x + y) / 2);
	const distanceToLine = $derived(Math.abs(x - y) / Math.SQRT2);
	const horizontalDistance = $derived(Math.abs(reflectedX - x));
	const verticalDistance = $derived(Math.abs(reflectedY - y));
	const horizontalDirection = $derived(reflectedX >= x ? 'right' : 'left');
	const verticalDirection = $derived(reflectedY >= y ? 'up' : 'down');
	const showReflectedDistanceLabel = $derived(Math.abs(x - y) > DISTANCE_LABEL_SPLIT_THRESHOLD);

	const pointScreenX = $derived(toScreenX(x));
	const pointScreenY = $derived(toScreenY(y));
	const reflectedPointScreenX = $derived(toScreenX(reflectedX));
	const reflectedPointScreenY = $derived(toScreenY(reflectedY));
	const projectionScreenX = $derived(toScreenX(projection));
	const projectionScreenY = $derived(toScreenY(projection));

	const topPointIsOriginal = $derived(pointScreenY <= reflectedPointScreenY);
	const originalLabelY = $derived((topPointIsOriginal ? pointScreenY : reflectedPointScreenY) - 8);
	const reflectedLabelY = $derived((topPointIsOriginal ? reflectedPointScreenY : pointScreenY) - 8);

	const pointLabelOnRight = $derived(pointScreenX >= reflectedPointScreenX);
	const reflectedLabelOnRight = $derived(reflectedPointScreenX >= pointScreenX);
	const pointLabelX = $derived(pointScreenX + (pointLabelOnRight ? 10 : -10));
	const reflectedLabelX = $derived(reflectedPointScreenX + (reflectedLabelOnRight ? 10 : -10));
	const pointLabelAnchor = $derived(pointLabelOnRight ? 'start' : 'end');
	const reflectedLabelAnchor = $derived(reflectedLabelOnRight ? 'start' : 'end');

	const distanceOneLabelX = $derived(toScreenX((x + projection) / 2));
	const distanceOneLabelY = $derived(toScreenY((y + projection) / 2) + 12);
	const distanceTwoLabelX = $derived(toScreenX((reflectedX + projection) / 2));
	const distanceTwoLabelY = $derived(toScreenY((reflectedY + projection) / 2) + 12);
	const axisHorizontalLabelX = $derived((pointScreenX + reflectedPointScreenX) / 2);
	const axisHorizontalLabelY = $derived(
		clamp(pointScreenY - 10, PLOT_PADDING + 10, PLOT_SIZE - PLOT_PADDING - 10)
	);
	const axisVerticalLabelX = $derived(reflectedPointScreenX + (reflectedPointScreenX >= pointScreenX ? 10 : -10));
	const axisVerticalLabelY = $derived((pointScreenY + reflectedPointScreenY) / 2);
	const axisVerticalLabelAnchor = $derived(reflectedPointScreenX >= pointScreenX ? 'start' : 'end');
	const showAxisDistanceLabels = $derived(horizontalDistance >= 0.75 || verticalDistance >= 0.75);

	const coordinateSummary = $derived.by(
		() =>
			`P=(${formatNumber(x)}, ${formatNumber(y)}),\\;P'=(${formatNumber(reflectedX)}, ${formatNumber(
				reflectedY
			)})`
	);
	const reflectionSummary = $derived.by(
		() => `x'=y=${formatNumber(y)},\\;y'=x=${formatNumber(x)}`
	);
	const distanceSummary = $derived.by(
		() => `d=\\frac{|x-y|}{\\sqrt{2}}=\\frac{|${formatNumber(x)}-${formatNumber(y)}|}{\\sqrt{2}}=${formatNumber(distanceToLine)}`
	);
	const segmentDistanceSummary = $derived.by(() => `d=${formatNumber(distanceToLine)}`);
	const axisHorizontalSummary = $derived.by(() => `|dx|=${formatNumber(horizontalDistance)}`);
	const axisVerticalSummary = $derived.by(() => `|dy|=${formatNumber(verticalDistance)}`);

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
		if (!svgPoint) {
			return;
		}

		x = snap(clamp(toPlotX(svgPoint.x), PLOT_MIN, PLOT_MAX));
		y = snap(clamp(toPlotY(svgPoint.y), PLOT_MIN, PLOT_MAX));
	}

	function handlePlotPointerDown(event: PointerEvent) {
		const svgPoint = pointerToSvgPoint(event);
		if (!svgPoint) {
			return;
		}

		const nearPoint =
			Math.hypot(svgPoint.x - pointScreenX, svgPoint.y - pointScreenY) <= POINT_HIT_RADIUS;

		if (!nearPoint) {
			return;
		}

		event.preventDefault();
		activeDrag = true;
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
		activeDrag = false;
		if (plotSvg?.hasPointerCapture(event.pointerId)) {
			plotSvg.releasePointerCapture(event.pointerId);
		}
	}

	function formatNumber(value: number) {
		return Number.isInteger(value) ? value.toString() : value.toFixed(1);
	}
</script>

<div class="min-w-0 space-y-4 select-none">
	<div class="tool-summary-grid min-w-0">
		<p class="tool-summary-card min-w-0 rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
			Reflection line:
			<MathExpression
				math="y=x"
				class="mt-1 block max-w-full overflow-x-auto whitespace-nowrap align-middle font-semibold text-foreground sm:mt-0 sm:ml-1 sm:inline-block [&_.katex]:whitespace-nowrap"
			/>
		</p>
		<p class="tool-summary-card min-w-0 rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
			Coordinates:
			<MathExpression
				math={coordinateSummary}
				class="mt-1 block max-w-full overflow-x-auto whitespace-nowrap align-middle font-semibold text-foreground sm:mt-0 sm:ml-1 sm:inline-block [&_.katex]:whitespace-nowrap"
			/>
		</p>
		<p class="tool-summary-card min-w-0 rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
			Swap rule:
			<MathExpression
				math={reflectionSummary}
				class="mt-1 block max-w-full overflow-x-auto whitespace-nowrap align-middle font-semibold text-foreground sm:mt-0 sm:ml-1 sm:inline-block [&_.katex]:whitespace-nowrap"
			/>
		</p>
		<p class="tool-summary-card min-w-0 rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
			Distance to line:
				<MathExpression
					math={distanceSummary}
					class="mt-1 block max-w-full overflow-x-auto whitespace-nowrap align-middle font-semibold text-foreground sm:mt-0 sm:ml-1 sm:inline-block [&_.katex]:whitespace-nowrap"
				/>
				<span class="mt-1 block text-xs text-foreground/85">
					Horizontal {horizontalDirection} {formatNumber(horizontalDistance)}, vertical {verticalDirection}
					{formatNumber(verticalDistance)}
				</span>
			</p>
		</div>

	<svg
		bind:this={plotSvg}
		viewBox={`0 0 ${PLOT_SIZE} ${PLOT_SIZE}`}
		class="w-full rounded-xl border border-border/70 bg-white select-none touch-none"
		role="img"
		aria-label="Coordinate graph showing reflection across y equals x"
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
			x1={toScreenX(PLOT_MIN)}
			y1={toScreenY(PLOT_MIN)}
			x2={toScreenX(PLOT_MAX)}
			y2={toScreenY(PLOT_MAX)}
			stroke="#0f766e"
			stroke-width="2.5"
		/>

		<line
			x1={pointScreenX}
			y1={pointScreenY}
			x2={projectionScreenX}
			y2={projectionScreenY}
			stroke="#0f172a"
			stroke-dasharray="5 4"
			stroke-width="1.5"
		/>
		<line
			x1={projectionScreenX}
			y1={projectionScreenY}
			x2={reflectedPointScreenX}
			y2={reflectedPointScreenY}
			stroke="#0f172a"
			stroke-dasharray="5 4"
			stroke-width="1.5"
		/>
		<line
			x1={pointScreenX}
			y1={pointScreenY}
			x2={reflectedPointScreenX}
			y2={pointScreenY}
			stroke="#2563eb"
			stroke-dasharray="3 3"
			stroke-width="1.25"
			opacity="0.85"
		/>
		<line
			x1={reflectedPointScreenX}
			y1={pointScreenY}
			x2={reflectedPointScreenX}
			y2={reflectedPointScreenY}
			stroke="#2563eb"
			stroke-dasharray="3 3"
			stroke-width="1.25"
			opacity="0.85"
		/>

		<text
			x={distanceOneLabelX}
			y={distanceOneLabelY}
			class="fill-slate-700 text-[10px] font-semibold"
			stroke="white"
			stroke-width="3"
			paint-order="stroke"
			stroke-linejoin="round"
			text-anchor="middle"
		>
			{segmentDistanceSummary}
		</text>
		{#if showReflectedDistanceLabel}
			<text
				x={distanceTwoLabelX}
				y={distanceTwoLabelY}
				class="fill-slate-700 text-[10px] font-semibold"
				stroke="white"
				stroke-width="3"
				paint-order="stroke"
				stroke-linejoin="round"
				text-anchor="middle"
			>
				{segmentDistanceSummary}
			</text>
		{/if}
		{#if showAxisDistanceLabels}
			<text
				x={axisHorizontalLabelX}
				y={axisHorizontalLabelY}
				class="fill-blue-700 text-[10px] font-semibold"
				stroke="white"
				stroke-width="3"
				paint-order="stroke"
				stroke-linejoin="round"
				text-anchor="middle"
			>
				{axisHorizontalSummary}
			</text>
			<text
				x={axisVerticalLabelX}
				y={axisVerticalLabelY}
				class="fill-blue-700 text-[10px] font-semibold"
				stroke="white"
				stroke-width="3"
				paint-order="stroke"
				stroke-linejoin="round"
				text-anchor={axisVerticalLabelAnchor}
			>
				{axisVerticalSummary}
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
		<circle cx={projectionScreenX} cy={projectionScreenY} r="4.5" fill="#475569" />
		<circle cx={reflectedPointScreenX} cy={reflectedPointScreenY} r="6" fill="#0f766e" />

		<text
			x={pointLabelX}
			y={originalLabelY}
			text-anchor={pointLabelAnchor}
			class="fill-slate-800 text-[11px] font-semibold"
		>
			P({formatNumber(x)}, {formatNumber(y)})
		</text>
		<text
			x={reflectedLabelX}
			y={reflectedLabelY}
			text-anchor={reflectedLabelAnchor}
			class="fill-slate-800 text-[11px] font-semibold"
		>
			P'({formatNumber(reflectedX)}, {formatNumber(reflectedY)})
		</text>
		<text
			x={projectionScreenX + 8}
			y={projectionScreenY - 6}
			class="fill-slate-700 text-[10px] font-semibold"
		>
			M
		</text>

		<text x={toScreenX(-9) + 6} y={toScreenY(-9) + 14} class="fill-teal-700 text-[11px] font-semibold">
			y = x
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
		Drag the blue point to reflect it across the line <span class="font-medium">y = x</span>.
	</p>
</div>
