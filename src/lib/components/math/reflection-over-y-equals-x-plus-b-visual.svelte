<script module lang="ts">
	import type { MathToolMeta } from './tool-meta';
	import { requireInteractiveToolMetaById } from './tool-registry';

	export const toolMeta: MathToolMeta = requireInteractiveToolMetaById(
		'reflection-over-y-equals-x-plus-b'
	);
</script>

<script lang="ts">
	import MathExpression from '$lib/components/math/math-expression.svelte';

	const PLOT_MIN = -10;
	const PLOT_MAX = 10;
	const B_MIN = -8;
	const B_MAX = 8;
	const STEP = 0.5;
	const POINT_HIT_RADIUS = 16;
	const LINE_HIT_DISTANCE = 0.9;
	const DISTANCE_LABEL_SPLIT_THRESHOLD = 1.5;
	const PLOT_SIZE = 420;
	const PLOT_PADDING = 34;
	const PLOT_INNER_SIZE = PLOT_SIZE - PLOT_PADDING * 2;
	const ticks = Array.from({ length: PLOT_MAX - PLOT_MIN + 1 }, (_, index) => PLOT_MIN + index);
	const majorTicks = [-10, -5, 0, 5, 10];

	type PlotPoint = { x: number; y: number };
	type LineEndpoints = { start: PlotPoint; end: PlotPoint };

	let b = $state(1);
	let x = $state(3);
	let y = $state(6);
	let plotSvg: SVGSVGElement | null = $state(null);
	let dragMode = $state<'none' | 'point' | 'line'>('none');
	let lineDragOffset = $state(0);

	const reflectedX = $derived(y - b);
	const reflectedY = $derived(x + b);
	const projectionX = $derived((x + y - b) / 2);
	const projectionY = $derived((x + y + b) / 2);
	const distanceToLine = $derived(Math.abs(y - x - b) / Math.SQRT2);
	const horizontalDistance = $derived(Math.abs(reflectedX - x));
	const verticalDistance = $derived(Math.abs(reflectedY - y));
	const horizontalDirection = $derived(reflectedX >= x ? 'right' : 'left');
	const verticalDirection = $derived(reflectedY >= y ? 'up' : 'down');
	const showReflectedDistanceLabel = $derived(
		Math.abs(y - x - b) > DISTANCE_LABEL_SPLIT_THRESHOLD
	);

	const xDragMin = $derived(Math.max(PLOT_MIN, PLOT_MIN - b));
	const xDragMax = $derived(Math.min(PLOT_MAX, PLOT_MAX - b));
	const yDragMin = $derived(Math.max(PLOT_MIN, PLOT_MIN + b));
	const yDragMax = $derived(Math.min(PLOT_MAX, PLOT_MAX + b));

	const pointScreenX = $derived(toScreenX(x));
	const pointScreenY = $derived(toScreenY(y));
	const reflectedPointScreenX = $derived(toScreenX(reflectedX));
	const reflectedPointScreenY = $derived(toScreenY(reflectedY));
	const projectionScreenX = $derived(toScreenX(projectionX));
	const projectionScreenY = $derived(toScreenY(projectionY));
	const lineEndpoints = $derived(getShiftedDiagonalEndpoints(b));

	const topPointIsOriginal = $derived(pointScreenY <= reflectedPointScreenY);
	const originalLabelY = $derived((topPointIsOriginal ? pointScreenY : reflectedPointScreenY) - 8);
	const reflectedLabelY = $derived((topPointIsOriginal ? reflectedPointScreenY : pointScreenY) - 8);

	const pointLabelOnRight = $derived(pointScreenX >= reflectedPointScreenX);
	const reflectedLabelOnRight = $derived(reflectedPointScreenX >= pointScreenX);
	const pointLabelX = $derived(pointScreenX + (pointLabelOnRight ? 10 : -10));
	const reflectedLabelX = $derived(reflectedPointScreenX + (reflectedLabelOnRight ? 10 : -10));
	const pointLabelAnchor = $derived(pointLabelOnRight ? 'start' : 'end');
	const reflectedLabelAnchor = $derived(reflectedLabelOnRight ? 'start' : 'end');

	const distanceOneLabelX = $derived(toScreenX((x + projectionX) / 2));
	const distanceOneLabelY = $derived(toScreenY((y + projectionY) / 2) + 12);
	const distanceTwoLabelX = $derived(toScreenX((reflectedX + projectionX) / 2));
	const distanceTwoLabelY = $derived(toScreenY((reflectedY + projectionY) / 2) + 12);

	const axisHorizontalLabelX = $derived((pointScreenX + reflectedPointScreenX) / 2);
	const axisHorizontalLabelY = $derived(
		clamp(pointScreenY - 10, PLOT_PADDING + 10, PLOT_SIZE - PLOT_PADDING - 10)
	);
	const axisVerticalLabelX = $derived(
		reflectedPointScreenX + (reflectedPointScreenX >= pointScreenX ? 10 : -10)
	);
	const axisVerticalLabelY = $derived((pointScreenY + reflectedPointScreenY) / 2);
	const axisVerticalLabelAnchor = $derived(
		reflectedPointScreenX >= pointScreenX ? 'start' : 'end'
	);
	const showAxisDistanceLabels = $derived(horizontalDistance >= 0.75 || verticalDistance >= 0.75);

	const lineSummary = $derived.by(
		() => (b === 0 ? 'y=x' : `y=x${b > 0 ? '+' : ''}${formatNumber(b)}`)
	);
	const coordinateSummary = $derived.by(
		() =>
			`P=(${formatNumber(x)}, ${formatNumber(y)}),\\;P'=(${formatNumber(reflectedX)}, ${formatNumber(
				reflectedY
			)})`
	);
	const reflectionSummary = $derived.by(
		() =>
			`x'=y-b=${formatNumber(y)}-(${formatNumber(b)})=${formatNumber(reflectedX)},\\;y'=x+b=${formatNumber(
				x
			)}+(${formatNumber(b)})=${formatNumber(reflectedY)}`
	);
	const distanceSummary = $derived.by(
		() =>
			`d=\\frac{|y-x-b|}{\\sqrt{2}}=\\frac{|${formatNumber(y)}-${formatNumber(x)}-(${formatNumber(
				b
			)})|}{\\sqrt{2}}=${formatNumber(distanceToLine)}`
	);
	const segmentDistanceSummary = $derived.by(() => `d=${formatNumber(distanceToLine)}`);
	const axisHorizontalSummary = $derived.by(() => `|dx|=${formatNumber(horizontalDistance)}`);
	const axisVerticalSummary = $derived.by(() => `|dy|=${formatNumber(verticalDistance)}`);

	$effect(() => {
		x = clamp(x, xDragMin, xDragMax);
		y = clamp(y, yDragMin, yDragMax);
	});

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

	function uniqueByDistance(points: PlotPoint[], epsilon = 1e-6): PlotPoint[] {
		const result: PlotPoint[] = [];

		for (const point of points) {
			const duplicate = result.some(
				(existing) =>
					Math.abs(existing.x - point.x) < epsilon && Math.abs(existing.y - point.y) < epsilon
			);
			if (!duplicate) {
				result.push(point);
			}
		}

		return result;
	}

	function getShiftedDiagonalEndpoints(shift: number): LineEndpoints {
		const candidates: PlotPoint[] = [];

		const yAtMinX = PLOT_MIN + shift;
		if (yAtMinX >= PLOT_MIN && yAtMinX <= PLOT_MAX) {
			candidates.push({ x: PLOT_MIN, y: yAtMinX });
		}

		const yAtMaxX = PLOT_MAX + shift;
		if (yAtMaxX >= PLOT_MIN && yAtMaxX <= PLOT_MAX) {
			candidates.push({ x: PLOT_MAX, y: yAtMaxX });
		}

		const xAtMinY = PLOT_MIN - shift;
		if (xAtMinY >= PLOT_MIN && xAtMinY <= PLOT_MAX) {
			candidates.push({ x: xAtMinY, y: PLOT_MIN });
		}

		const xAtMaxY = PLOT_MAX - shift;
		if (xAtMaxY >= PLOT_MIN && xAtMaxY <= PLOT_MAX) {
			candidates.push({ x: xAtMaxY, y: PLOT_MAX });
		}

		const unique = uniqueByDistance(candidates).sort((left, right) => left.x - right.x || left.y - right.y);

		if (unique.length >= 2) {
			return { start: unique[0], end: unique[unique.length - 1] };
		}

		return {
			start: { x: PLOT_MIN, y: PLOT_MIN + shift },
			end: { x: PLOT_MAX, y: PLOT_MAX + shift }
		};
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

		x = snap(clamp(toPlotX(svgPoint.x), xDragMin, xDragMax));
		y = snap(clamp(toPlotY(svgPoint.y), yDragMin, yDragMax));
	}

	function updateLineFromPointer(event: PointerEvent) {
		const svgPoint = pointerToSvgPoint(event);
		if (!svgPoint) {
			return;
		}

		const plotX = toPlotX(svgPoint.x);
		const plotY = toPlotY(svgPoint.y);
		b = snap(clamp(plotY - plotX - lineDragOffset, B_MIN, B_MAX));
	}

	function handlePlotPointerDown(event: PointerEvent) {
		const svgPoint = pointerToSvgPoint(event);
		if (!svgPoint) {
			return;
		}

		const plotX = toPlotX(svgPoint.x);
		const plotY = toPlotY(svgPoint.y);
		const nearPoint =
			Math.hypot(svgPoint.x - pointScreenX, svgPoint.y - pointScreenY) <= POINT_HIT_RADIUS;
		const nearLine = Math.abs(plotY - plotX - b) / Math.SQRT2 <= LINE_HIT_DISTANCE;

		if (!nearPoint && !nearLine) {
			return;
		}

		event.preventDefault();
		dragMode = nearPoint ? 'point' : 'line';
		if (dragMode === 'line') {
			lineDragOffset = plotY - plotX - b;
			updateLineFromPointer(event);
		} else {
			updateFromPointer(event);
		}
		plotSvg?.setPointerCapture(event.pointerId);
	}

	function handlePlotPointerMove(event: PointerEvent) {
		if (dragMode === 'none') {
			return;
		}

		event.preventDefault();
		if (dragMode === 'point') {
			updateFromPointer(event);
			return;
		}
		updateLineFromPointer(event);
	}

	function stopDrag(event: PointerEvent) {
		if (dragMode === 'none') {
			return;
		}

		dragMode = 'none';
		if (plotSvg?.hasPointerCapture(event.pointerId)) {
			plotSvg.releasePointerCapture(event.pointerId);
		}
	}

	function formatNumber(value: number) {
		return Number.isInteger(value) ? value.toString() : value.toFixed(1);
	}
</script>

<div class="space-y-4 select-none">
	<div class="tool-summary-grid">
		<p class="tool-summary-card rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
			Reflection line:
			<MathExpression
				math={lineSummary}
				class="ml-1 inline-block max-w-full overflow-x-auto whitespace-nowrap align-middle font-semibold text-foreground [&_.katex]:whitespace-nowrap"
			/>
		</p>
		<p class="tool-summary-card rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
			Coordinates:
			<MathExpression
				math={coordinateSummary}
				class="ml-1 inline-block max-w-full overflow-x-auto whitespace-nowrap align-middle font-semibold text-foreground [&_.katex]:whitespace-nowrap"
			/>
		</p>
		<p class="tool-summary-card rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
			Shift rule:
			<MathExpression
				math={reflectionSummary}
				class="ml-1 inline-block max-w-full overflow-x-auto whitespace-nowrap align-middle font-semibold text-foreground [&_.katex]:whitespace-nowrap"
			/>
		</p>
		<p class="tool-summary-card rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
			Distance to line:
			<MathExpression
				math={distanceSummary}
				class="ml-1 inline-block max-w-full overflow-x-auto whitespace-nowrap align-middle font-semibold text-foreground [&_.katex]:whitespace-nowrap"
			/>
			<span class="mt-1 block text-xs text-foreground/85">
				Horizontal {horizontalDirection} {formatNumber(horizontalDistance)}, vertical {verticalDirection}
				{formatNumber(verticalDistance)}
			</span>
		</p>
	</div>

	<p class="rounded-xl border border-border/70 bg-background/75 px-3 py-2 text-xs text-muted-foreground">
		Drag the teal mirror line to move <span class="font-medium">b</span>, or drag the blue point.
	</p>

	<svg
		bind:this={plotSvg}
		viewBox={`0 0 ${PLOT_SIZE} ${PLOT_SIZE}`}
		class="w-full rounded-xl border border-border/70 bg-white select-none touch-none"
		role="img"
		aria-label="Coordinate graph showing reflection across y equals x plus b"
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
			x1={toScreenX(lineEndpoints.start.x)}
			y1={toScreenY(lineEndpoints.start.y)}
			x2={toScreenX(lineEndpoints.end.x)}
			y2={toScreenY(lineEndpoints.end.y)}
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

		<text
			x={toScreenX(lineEndpoints.start.x) + 8}
			y={toScreenY(lineEndpoints.start.y) + 14}
			class="fill-teal-700 text-[11px] font-semibold"
		>
			{lineSummary}
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
		Drag the mirror line or the blue point to reflect across <span class="font-medium">{lineSummary}</span>.
	</p>
</div>
