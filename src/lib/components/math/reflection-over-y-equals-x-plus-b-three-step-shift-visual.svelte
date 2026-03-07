<script module lang="ts">
	import type { MathToolMeta } from './tool-meta';
	import { requireInteractiveToolMetaById } from './tool-registry';

	export const toolMeta: MathToolMeta = requireInteractiveToolMetaById(
		'reflection-over-y-equals-x-plus-b-three-step-shift'
	);
</script>

<script lang="ts">
	import MathExpression from '$lib/components/math/math-expression.svelte';

	const PLOT_MIN = -10;
	const PLOT_MAX = 10;
	const B_MIN = -6;
	const B_MAX = 6;
	const POINT_MIN = -8;
	const POINT_MAX = 8;
	const POINT_STEP = 0.5;
	const B_STEP = 0.5;
	const POINT_HIT_RADIUS = 16;
	const PLOT_SIZE = 420;
	const PLOT_PADDING = 34;
	const PLOT_INNER_SIZE = PLOT_SIZE - PLOT_PADDING * 2;
	const ticks = Array.from({ length: PLOT_MAX - PLOT_MIN + 1 }, (_, index) => PLOT_MIN + index);
	const majorTicks = [-10, -5, 0, 5, 10];

	type PlotPoint = { x: number; y: number };
	type LineEndpoints = { start: PlotPoint; end: PlotPoint };
	type ScreenPoint = { x: number; y: number };
	type ArrowSegment = { start: ScreenPoint; end: ScreenPoint; mid: ScreenPoint };

	const steps = [
		'Choose P and y=x+b',
		'Apply vertical shift: y-b',
		'Reflect across y=x',
		'Translate back: y+b'
	] as const;

	let b = $state(2);
	let x = $state(-4);
	let y = $state(7);
	let stepIndex = $state(0);
	let plotSvg: SVGSVGElement | null = $state(null);
	let activeDrag = $state(false);

	const xMin = $derived(Math.max(POINT_MIN, PLOT_MIN - b));
	const xMax = $derived(Math.min(POINT_MAX, PLOT_MAX - b));
	const yMin = $derived(Math.max(POINT_MIN, PLOT_MIN + b));
	const yMax = $derived(Math.min(POINT_MAX, PLOT_MAX + b));

	$effect(() => {
		x = clamp(x, xMin, xMax);
		y = clamp(y, yMin, yMax);
	});

	const originalPoint = $derived.by<PlotPoint>(() => ({ x, y }));
	const shiftedPoint = $derived.by<PlotPoint>(() => ({ x, y: y - b }));
	const flippedPoint = $derived.by<PlotPoint>(() => ({ x: y - b, y: x }));
	const finalReflectedPoint = $derived.by<PlotPoint>(() => ({
		x: y - b,
		y: x + b
	}));

	const canEditSetup = $derived(stepIndex === 0);
	const canGoBack = $derived(stepIndex > 0);
	const canGoForward = $derived(stepIndex < steps.length - 1);

	const originalLineMath = $derived.by(() => lineToTeX(1, b));
	const centeredLineMath = 'y=x';

	const currentLineIntercept = $derived.by(() => {
		if (stepIndex === 0 || stepIndex === 3) {
			return b;
		}
		return 0;
	});
	const currentLine = $derived.by(() => getShiftedDiagonalEndpoints(currentLineIntercept));
	const ghostLine = $derived.by<LineEndpoints | null>(() => {
		if (stepIndex === 1) {
			return getShiftedDiagonalEndpoints(b);
		}
		if (stepIndex === 3) {
			return getShiftedDiagonalEndpoints(0);
		}
		return null;
	});

	const activePoint = $derived.by<PlotPoint>(() => {
		if (stepIndex === 0) {
			return originalPoint;
		}
		if (stepIndex === 1) {
			return shiftedPoint;
		}
		if (stepIndex === 2) {
			return flippedPoint;
		}
		return finalReflectedPoint;
	});

	const activePointColor = $derived(stepIndex === 3 ? '#0f766e' : '#2563eb');
	const activePointLabel = $derived.by(() => {
		if (stepIndex === 0) {
			return 'P';
		}
		if (stepIndex === 1) {
			return 'P1';
		}
		if (stepIndex === 2) {
			return 'P2';
		}
		return "P'";
	});

	const showOriginalReference = $derived(stepIndex >= 1);
	const showShiftedReference = $derived(stepIndex >= 2);
	const showFlippedReference = $derived(stepIndex === 3);

	const transitionStart = $derived.by<PlotPoint | null>(() => {
		if (stepIndex === 1) {
			return originalPoint;
		}
		if (stepIndex === 2) {
			return shiftedPoint;
		}
		if (stepIndex === 3) {
			return flippedPoint;
		}
		return null;
	});
	const transitionEnd = $derived.by<PlotPoint | null>(() => {
		if (stepIndex === 0) {
			return null;
		}
		return activePoint;
	});

	const transitionLabel = $derived.by(() => {
		if (stepIndex === 1) {
			return '-b on y';
		}
		if (stepIndex === 2) {
			return 'swap x and y';
		}
		if (stepIndex === 3) {
			return '+b on y';
		}
		return '';
	});

	const activePointScreenX = $derived(toScreenX(activePoint.x));
	const activePointScreenY = $derived(toScreenY(activePoint.y));
	const originalPointScreenX = $derived(toScreenX(originalPoint.x));
	const originalPointScreenY = $derived(toScreenY(originalPoint.y));
	const shiftedPointScreenX = $derived(toScreenX(shiftedPoint.x));
	const shiftedPointScreenY = $derived(toScreenY(shiftedPoint.y));
	const flippedPointScreenX = $derived(toScreenX(flippedPoint.x));
	const flippedPointScreenY = $derived(toScreenY(flippedPoint.y));

	const transitionStartScreen = $derived.by<ScreenPoint | null>(() => {
		if (!transitionStart) {
			return null;
		}
		return {
			x: toScreenX(transitionStart.x),
			y: toScreenY(transitionStart.y)
		};
	});
	const transitionEndScreen = $derived.by<ScreenPoint | null>(() => {
		if (!transitionEnd) {
			return null;
		}
		return {
			x: toScreenX(transitionEnd.x),
			y: toScreenY(transitionEnd.y)
		};
	});
	const transitionArrow = $derived.by<ArrowSegment | null>(() => {
		if (!transitionStartScreen || !transitionEndScreen) {
			return null;
		}
		return trimArrowSegment(transitionStartScreen, transitionEndScreen, 4, 12);
	});

	const lineShiftArrowStart = $derived.by<PlotPoint | null>(() => {
		if (stepIndex === 1) {
			return { x: 3, y: 3 + b };
		}
		if (stepIndex === 3) {
			return { x: 3, y: 3 };
		}
		return null;
	});
	const lineShiftArrowEnd = $derived.by<PlotPoint | null>(() => {
		if (stepIndex === 1) {
			return { x: 3, y: 3 };
		}
		if (stepIndex === 3) {
			return { x: 3, y: 3 + b };
		}
		return null;
	});
	const lineShiftArrowScreen = $derived.by<ArrowSegment | null>(() => {
		if (!lineShiftArrowStart || !lineShiftArrowEnd) {
			return null;
		}
		const start = {
			x: toScreenX(lineShiftArrowStart.x),
			y: toScreenY(lineShiftArrowStart.y)
		};
		const end = {
			x: toScreenX(lineShiftArrowEnd.x),
			y: toScreenY(lineShiftArrowEnd.y)
		};
		return trimArrowSegment(start, end, 6, 6);
	});
	const lineShiftLabel = $derived.by(() => {
		if (stepIndex === 1) {
			return '-b';
		}
		if (stepIndex === 3) {
			return '+b';
		}
		return '';
	});

	const currentLineMath = $derived.by(() => lineToTeX(1, currentLineIntercept));
	const selectedPointMath = $derived.by(() => pointToTeX('P', originalPoint));
	const finalPointMath = $derived.by(() => pointToTeX("P'", finalReflectedPoint));
	const stepMath = $derived.by(() => {
		switch (stepIndex) {
			case 0:
				return `${pointToTeX('P', originalPoint)},\\;\\ell:${originalLineMath}`;
			case 1:
				return `y\\leftarrow y-b,\\;${pointToTeX('P_1', shiftedPoint)},\\;\\ell_1:y=x`;
			case 2:
				return `${pointToTeX('P_2', flippedPoint)},\\;P_2=(y-b,x)`;
			default:
				return `${finalPointMath},\\;\\ell:${originalLineMath}`;
		}
	});

	const stepHint = $derived.by(() => {
		switch (stepIndex) {
			case 0:
				return 'Set b and drag the blue point P.';
			case 1:
				return 'Subtract b from y-values so the mirror line becomes y=x.';
			case 2:
				return 'Reflect across y=x by swapping x and y.';
			default:
				return 'Add b back to return to the original frame.';
		}
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

	function snap(value: number, step = POINT_STEP) {
		return Math.round(value / step) * step;
	}

	function normalizeZero(value: number) {
		return Math.abs(value) < 1e-9 ? 0 : value;
	}

	function roundForDisplay(value: number) {
		const rounded = Math.round(value * 100) / 100;
		return normalizeZero(rounded);
	}

	function formatNumber(value: number) {
		return roundForDisplay(value).toString();
	}

	function pointToTeX(label: string, point: PlotPoint) {
		return `${label}=(${formatNumber(point.x)},${formatNumber(point.y)})`;
	}

	function lineToTeX(slope: number, intercept: number) {
		const s = normalizeZero(slope);
		const c = normalizeZero(intercept);
		if (s === 0) {
			return `y=${formatNumber(c)}`;
		}

		let slopePart = '';
		if (s === 1) {
			slopePart = 'x';
		} else if (s === -1) {
			slopePart = '-x';
		} else {
			slopePart = `${formatNumber(s)}x`;
		}

		if (c === 0) {
			return `y=${slopePart}`;
		}

		return `y=${slopePart}${c > 0 ? '+' : '-'}${formatNumber(Math.abs(c))}`;
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

	function trimArrowSegment(
		start: ScreenPoint,
		end: ScreenPoint,
		startInset: number,
		endInset: number
	): ArrowSegment {
		const dx = end.x - start.x;
		const dy = end.y - start.y;
		const distance = Math.hypot(dx, dy);
		if (distance < 1e-6) {
			return { start, end, mid: start };
		}

		const unitX = dx / distance;
		const unitY = dy / distance;
		const maxInset = Math.max(distance - 2, 0);
		const safeStartInset = Math.min(startInset, maxInset / 2);
		const safeEndInset = Math.min(endInset, maxInset - safeStartInset);

		const trimmedStart = {
			x: start.x + unitX * safeStartInset,
			y: start.y + unitY * safeStartInset
		};
		const trimmedEnd = {
			x: end.x - unitX * safeEndInset,
			y: end.y - unitY * safeEndInset
		};

		return {
			start: trimmedStart,
			end: trimmedEnd,
			mid: {
				x: (trimmedStart.x + trimmedEnd.x) / 2,
				y: (trimmedStart.y + trimmedEnd.y) / 2
			}
		};
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

		const unique = uniqueByDistance(candidates).sort(
			(left, right) => left.x - right.x || left.y - right.y
		);

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

	function updatePointFromPointer(event: PointerEvent) {
		const svgPoint = pointerToSvgPoint(event);
		if (!svgPoint) {
			return;
		}

		x = snap(clamp(toPlotX(svgPoint.x), xMin, xMax));
		y = snap(clamp(toPlotY(svgPoint.y), yMin, yMax));
	}

	function handlePlotPointerDown(event: PointerEvent) {
		if (!canEditSetup) {
			return;
		}

		const svgPoint = pointerToSvgPoint(event);
		if (!svgPoint) {
			return;
		}

		const nearPoint =
			Math.hypot(svgPoint.x - originalPointScreenX, svgPoint.y - originalPointScreenY) <= POINT_HIT_RADIUS;
		if (!nearPoint) {
			return;
		}

		event.preventDefault();
		activeDrag = true;
		plotSvg?.setPointerCapture(event.pointerId);
		updatePointFromPointer(event);
	}

	function handlePlotPointerMove(event: PointerEvent) {
		if (!activeDrag || !canEditSetup) {
			return;
		}
		event.preventDefault();
		updatePointFromPointer(event);
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

	function nextStep() {
		if (canGoForward) {
			stepIndex += 1;
		}
	}

	function previousStep() {
		if (canGoBack) {
			stepIndex -= 1;
		}
	}

	function resetSteps() {
		stepIndex = 0;
	}
</script>

<div class="space-y-4 select-none">
	<div class="tool-summary-grid">
		<p class="tool-summary-card rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
			Step:
			<span class="ml-1 font-semibold text-foreground">{stepIndex + 1}/{steps.length}</span>
			<span class="mt-1 block text-xs text-foreground/85">{steps[stepIndex]}</span>
		</p>
		<p class="tool-summary-card rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
			Selected line:
			<MathExpression
				math={originalLineMath}
				class="ml-1 inline-block max-w-full overflow-x-auto whitespace-nowrap align-middle font-semibold text-foreground [&_.katex]:whitespace-nowrap"
			/>
			<span class="mt-1 block text-xs text-foreground/85">
				Centered line:
				<MathExpression
					math={centeredLineMath}
					class="ml-1 inline-block max-w-full overflow-x-auto whitespace-nowrap align-middle font-semibold text-foreground [&_.katex]:whitespace-nowrap"
				/>
			</span>
		</p>
		<p class="tool-summary-card rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
			Chosen point:
			<MathExpression
				math={selectedPointMath}
				class="ml-1 inline-block max-w-full overflow-x-auto whitespace-nowrap align-middle font-semibold text-foreground [&_.katex]:whitespace-nowrap"
			/>
			<span class="mt-1 block text-xs text-foreground/85">
				Final:
				<MathExpression
					math={finalPointMath}
					class="ml-1 inline-block max-w-full overflow-x-auto whitespace-nowrap align-middle font-semibold text-foreground [&_.katex]:whitespace-nowrap"
				/>
			</span>
		</p>
		<p class="tool-summary-card rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
			Current transform:
			<MathExpression
				math={stepMath}
				class="ml-1 inline-block max-w-full overflow-x-auto whitespace-nowrap align-middle font-semibold text-foreground [&_.katex]:whitespace-nowrap"
			/>
			<span class="mt-1 block text-xs text-foreground/85">{stepHint}</span>
		</p>
	</div>

	<div class="grid gap-3 sm:grid-cols-3">
		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			x-coordinate: {formatNumber(x)}
			<input
				type="range"
				min={xMin}
				max={xMax}
				step={POINT_STEP}
				bind:value={x}
				disabled={!canEditSetup}
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary disabled:cursor-not-allowed disabled:opacity-50"
			/>
		</label>
		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			y-coordinate: {formatNumber(y)}
			<input
				type="range"
				min={yMin}
				max={yMax}
				step={POINT_STEP}
				bind:value={y}
				disabled={!canEditSetup}
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary disabled:cursor-not-allowed disabled:opacity-50"
			/>
		</label>
		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			Shift b: {formatNumber(b)}
			<input
				type="range"
				min={B_MIN}
				max={B_MAX}
				step={B_STEP}
				bind:value={b}
				disabled={!canEditSetup}
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary disabled:cursor-not-allowed disabled:opacity-50"
			/>
		</label>
	</div>

	<div class="flex flex-wrap items-center gap-2">
		<button
			type="button"
			onclick={previousStep}
			disabled={!canGoBack}
			class="rounded-md border border-border/70 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
		>
			Back
		</button>
		<button
			type="button"
			onclick={nextStep}
			disabled={!canGoForward}
			class="rounded-md border border-primary/40 bg-primary/12 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/18 disabled:cursor-not-allowed disabled:opacity-50"
		>
			Forward
		</button>
		<button
			type="button"
			onclick={resetSteps}
			class="rounded-md border border-border/70 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
		>
			Reset
		</button>
		<span class="text-xs text-muted-foreground">
			{#if canEditSetup}
				Drag the blue point to choose P, then use Forward.
			{:else}
				Use Back to return to step 1 and edit setup.
			{/if}
		</span>
	</div>

	<svg
		bind:this={plotSvg}
		viewBox={`0 0 ${PLOT_SIZE} ${PLOT_SIZE}`}
		class="w-full rounded-xl border border-border/70 bg-white select-none touch-none"
		role="img"
		aria-label="Step-by-step reflection of a point across y equals x plus b"
		onpointerdown={handlePlotPointerDown}
		onpointermove={handlePlotPointerMove}
		onpointerup={stopDrag}
		onpointercancel={stopDrag}
	>
		<defs>
			<marker
				id="x-plus-b-step-arrow"
				viewBox="0 0 8 8"
				refX="7.1"
				refY="4"
				markerWidth="6"
				markerHeight="6"
				orient="auto-start-reverse"
			>
				<path d="M 0 0 L 8 4 L 0 8 z" fill="#1d4ed8" />
			</marker>
		</defs>

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

		{#if ghostLine}
			<line
				x1={toScreenX(ghostLine.start.x)}
				y1={toScreenY(ghostLine.start.y)}
				x2={toScreenX(ghostLine.end.x)}
				y2={toScreenY(ghostLine.end.y)}
				stroke="#94a3b8"
				stroke-dasharray="6 5"
				stroke-width="1.8"
			/>
		{/if}

		<line
			x1={toScreenX(currentLine.start.x)}
			y1={toScreenY(currentLine.start.y)}
			x2={toScreenX(currentLine.end.x)}
			y2={toScreenY(currentLine.end.y)}
			stroke="#0f766e"
			stroke-width="2.6"
		/>

		{#if lineShiftArrowScreen}
			<line
				x1={lineShiftArrowScreen.start.x}
				y1={lineShiftArrowScreen.start.y}
				x2={lineShiftArrowScreen.end.x}
				y2={lineShiftArrowScreen.end.y}
				stroke="#0f766e"
				stroke-width="2"
				stroke-dasharray="5 4"
				marker-end="url(#x-plus-b-step-arrow)"
			/>
			<text
				x={lineShiftArrowScreen.mid.x + 9}
				y={lineShiftArrowScreen.mid.y - 8}
				class="fill-teal-700 text-[10px] font-semibold"
			>
				line shift {lineShiftLabel}
			</text>
		{/if}

		{#if transitionArrow}
			<line
				x1={transitionArrow.start.x}
				y1={transitionArrow.start.y}
				x2={transitionArrow.end.x}
				y2={transitionArrow.end.y}
				stroke="#1d4ed8"
				stroke-width="2"
				stroke-dasharray="6 4"
				marker-end="url(#x-plus-b-step-arrow)"
			/>
			<text
				x={transitionArrow.mid.x + 8}
				y={transitionArrow.mid.y - 8}
				class="fill-blue-700 text-[10px] font-semibold"
			>
				{transitionLabel}
			</text>
		{/if}

		{#if showOriginalReference}
			<circle
				cx={originalPointScreenX}
				cy={originalPointScreenY}
				r="5.5"
				fill="#dbeafe"
				stroke="#2563eb"
				stroke-width="1.5"
			/>
			<text
				x={originalPointScreenX + 8}
				y={originalPointScreenY - 8}
				class="fill-blue-700 text-[10px] font-semibold"
			>
				P
			</text>
		{/if}

		{#if showShiftedReference}
			<circle cx={shiftedPointScreenX} cy={shiftedPointScreenY} r="5" fill="#bfdbfe" stroke="#2563eb" stroke-width="1.2" />
			<text
				x={shiftedPointScreenX + 8}
				y={shiftedPointScreenY - 8}
				class="fill-blue-700 text-[10px] font-semibold"
			>
				P1
			</text>
		{/if}

		{#if showFlippedReference}
			<circle cx={flippedPointScreenX} cy={flippedPointScreenY} r="5" fill="#ccfbf1" stroke="#0f766e" stroke-width="1.2" />
			<text
				x={flippedPointScreenX + 8}
				y={flippedPointScreenY - 8}
				class="fill-teal-700 text-[10px] font-semibold"
			>
				P2
			</text>
		{/if}

		<circle
			cx={activePointScreenX}
			cy={activePointScreenY}
			r="14"
			fill="transparent"
			style={`cursor:${canEditSetup ? 'grab' : 'default'};`}
		/>
		<circle
			cx={activePointScreenX}
			cy={activePointScreenY}
			r="6"
			fill={activePointColor}
			style={`cursor:${canEditSetup ? 'grab' : 'default'};`}
		/>
		<text
			x={activePointScreenX + 8}
			y={activePointScreenY - 8}
			class="fill-slate-800 text-[11px] font-semibold"
		>
			{activePointLabel}
		</text>

		<text
			x={toScreenX(currentLine.start.x) + 8}
			y={toScreenY(currentLine.start.y) + 14}
			class="fill-teal-700 text-[11px] font-semibold"
		>
			{currentLineMath}
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
		Current mirror line:
		<MathExpression
			math={currentLineMath}
			class="ml-1 inline-block max-w-full overflow-x-auto whitespace-nowrap align-middle font-semibold text-foreground [&_.katex]:whitespace-nowrap"
		/>
	</p>
</div>
