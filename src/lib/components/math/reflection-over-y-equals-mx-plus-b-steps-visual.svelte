<script module lang="ts">
	import type { MathToolMeta } from './tool-meta';
	import { requireInteractiveToolMetaById } from './tool-registry';

	export const toolMeta: MathToolMeta = requireInteractiveToolMetaById(
		'reflection-over-y-equals-mx-plus-b-steps'
	);
</script>

<script lang="ts">
	import MathExpression from '$lib/components/math/math-expression.svelte';

	const PLOT_MIN = -10;
	const PLOT_MAX = 10;
	const M_MIN = -2;
	const M_MAX = 2;
	const B_MIN = -6;
	const B_MAX = 6;
	const POINT_MIN = -8;
	const POINT_MAX = 8;
	const POINT_STEP = 0.5;
	const M_STEP = 0.25;
	const B_STEP = 0.5;
	const POINT_HIT_RADIUS = 16;
	const DISTANCE_LABEL_HIDE_THRESHOLD = 3.5;
	const THETA_ARC_RADIUS = 2.35;
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
		'Choose P and y=mx+b',
		'Show shift cue: -b',
		'Apply vertical shift',
		'Show angle θ',
		'Rotate to y=0',
		'Reflect across y=0',
		'Show rotate-back cue: +θ',
		'Apply rotate back',
		'Show shift cue: +b',
		'Translate back'
	] as const;

	let m = $state(1);
	let b = $state(2);
	let x = $state(-7);
	let y = $state(3);
	let stepIndex = $state(0);
	let plotSvg: SVGSVGElement | null = $state(null);
	let activeDrag = $state(false);

	const theta = $derived(Math.atan(m));
	const cosTheta = $derived(Math.cos(theta));
	const sinTheta = $derived(Math.sin(theta));

	const originalPoint = $derived.by<PlotPoint>(() => ({ x, y }));
	const shiftedPoint = $derived.by<PlotPoint>(() => ({ x, y: y - b }));
	const rotatedPoint = $derived.by<PlotPoint>(() => rotateToXAxis(shiftedPoint));
	const reflectedRotatedPoint = $derived.by<PlotPoint>(() => ({ x: rotatedPoint.x, y: -rotatedPoint.y }));
	const unrotatedReflectedPoint = $derived.by<PlotPoint>(() => rotateFromXAxis(reflectedRotatedPoint));
	const finalReflectedPoint = $derived.by<PlotPoint>(() => ({
		x: unrotatedReflectedPoint.x,
		y: unrotatedReflectedPoint.y + b
	}));

	const canEditSetup = $derived(stepIndex === 0);
	const canGoBack = $derived(stepIndex > 0);
	const canGoForward = $derived(stepIndex < steps.length - 1);

	const hasVerticalShift = $derived(Math.abs(b) > 1e-9);
	const showMinusShiftCue = $derived(stepIndex === 1 && hasVerticalShift);
	const showPlusShiftCue = $derived(stepIndex === 8 && hasVerticalShift);
	const showShiftPreviewGhosts = $derived(stepIndex === 1 && hasVerticalShift);
	const showRotateBackCue = $derived(stepIndex === 6);
	const showTheta = $derived(stepIndex === 3);
	const showReflectionStep = $derived(stepIndex === 5);
	const showShiftedGhosts = $derived(stepIndex === 2);
	const showFinalTranslationGhosts = $derived(stepIndex === 9);
	const showOriginalReference = $derived(stepIndex >= 2);
	const showSecondDistanceLabel = $derived(Math.abs(rotatedPoint.y) >= DISTANCE_LABEL_HIDE_THRESHOLD);

	const currentLineSlope = $derived.by(() => {
		if (stepIndex === 4 || stepIndex === 5 || stepIndex === 6) {
			return 0;
		}
		return m;
	});
	const currentLineIntercept = $derived.by(() => {
		if (stepIndex <= 1 || stepIndex === 9) {
			return b;
		}
		return 0;
	});
	const currentLine = $derived.by(() => getLineEndpoints(currentLineSlope, currentLineIntercept));

	const ghostLine = $derived.by<LineEndpoints | null>(() => {
		if (showShiftPreviewGhosts) {
			return getLineEndpoints(m, 0);
		}
		if (showTheta) {
			return getLineEndpoints(0, 0);
		}
		if (showShiftedGhosts) {
			return getLineEndpoints(m, b);
		}
		if (showRotateBackCue) {
			return getLineEndpoints(m, 0);
		}
		if (showPlusShiftCue) {
			return getLineEndpoints(m, b);
		}
		if (showFinalTranslationGhosts) {
			return getLineEndpoints(m, 0);
		}
		return null;
	});

	const activePoint = $derived.by<PlotPoint>(() => {
		if (stepIndex <= 1) {
			return originalPoint;
		}
		if (stepIndex <= 3) {
			return shiftedPoint;
		}
		if (stepIndex === 4) {
			return rotatedPoint;
		}
		if (stepIndex === 5) {
			return reflectedRotatedPoint;
		}
		if (stepIndex === 6) {
			return reflectedRotatedPoint;
		}
		if (stepIndex <= 8) {
			return unrotatedReflectedPoint;
		}
		return finalReflectedPoint;
	});

	const activePointColor = $derived(stepIndex >= 5 ? '#0f766e' : '#2563eb');
	const activePointLabel = $derived.by(() => {
		if (stepIndex <= 4) {
			return 'P';
		}
		if (stepIndex === 6) {
			return "Q'";
		}
		if (stepIndex === 7 || stepIndex === 8) {
			return 'P3';
		}
		return "P'";
	});

	const activePointScreenX = $derived(toScreenX(activePoint.x));
	const activePointScreenY = $derived(toScreenY(activePoint.y));
	const originalPointScreenX = $derived(toScreenX(originalPoint.x));
	const originalPointScreenY = $derived(toScreenY(originalPoint.y));
	const shiftedPointScreenX = $derived(toScreenX(shiftedPoint.x));
	const shiftedPointScreenY = $derived(toScreenY(shiftedPoint.y));
	const rotatedPointScreenX = $derived(toScreenX(rotatedPoint.x));
	const rotatedPointScreenY = $derived(toScreenY(rotatedPoint.y));
	const reflectedRotatedScreenX = $derived(toScreenX(reflectedRotatedPoint.x));
	const reflectedRotatedScreenY = $derived(toScreenY(reflectedRotatedPoint.y));
	const unrotatedReflectedScreenX = $derived(toScreenX(unrotatedReflectedPoint.x));
	const unrotatedReflectedScreenY = $derived(toScreenY(unrotatedReflectedPoint.y));
	const finalReflectedScreenX = $derived(toScreenX(finalReflectedPoint.x));
	const finalReflectedScreenY = $derived(toScreenY(finalReflectedPoint.y));
	const axisYScreen = $derived(toScreenY(0));

	const minusShiftPointArrow = $derived.by<ArrowSegment | null>(() => {
		if (!showMinusShiftCue) {
			return null;
		}
		return trimArrowSegment(
			{ x: originalPointScreenX, y: originalPointScreenY },
			{ x: shiftedPointScreenX, y: shiftedPointScreenY },
			8,
			10
		);
	});
	const minusShiftLineArrow = $derived.by<ArrowSegment | null>(() => {
		if (!showMinusShiftCue) {
			return null;
		}
		return trimArrowSegment(
			{ x: toScreenX(0), y: toScreenY(b) },
			{ x: toScreenX(0), y: toScreenY(0) },
			6,
			6
		);
	});
	const rotateToAxisPointArrow = $derived.by<ArrowSegment | null>(() => {
		if (!showTheta) {
			return null;
		}
		return trimArrowSegment(
			{ x: shiftedPointScreenX, y: shiftedPointScreenY },
			{ x: rotatedPointScreenX, y: rotatedPointScreenY },
			8,
			10
		);
	});
	const rotateToAxisLineArrow = $derived.by<ArrowSegment | null>(() => {
		if (!showTheta) {
			return null;
		}
		const cueStart = { x: 3, y: 3 * m };
		const cueEnd = rotateToXAxis(cueStart);
		return trimArrowSegment(
			{ x: toScreenX(cueStart.x), y: toScreenY(cueStart.y) },
			{ x: toScreenX(cueEnd.x), y: toScreenY(cueEnd.y) },
			6,
			6
		);
	});
	const rotateBackPointArrow = $derived.by<ArrowSegment | null>(() => {
		if (!showRotateBackCue) {
			return null;
		}
		return trimArrowSegment(
			{ x: reflectedRotatedScreenX, y: reflectedRotatedScreenY },
			{ x: unrotatedReflectedScreenX, y: unrotatedReflectedScreenY },
			8,
			10
		);
	});
	const plusShiftPointArrow = $derived.by<ArrowSegment | null>(() => {
		if (!showPlusShiftCue) {
			return null;
		}
		return trimArrowSegment(
			{ x: unrotatedReflectedScreenX, y: unrotatedReflectedScreenY },
			{ x: finalReflectedScreenX, y: finalReflectedScreenY },
			8,
			10
		);
	});
	const plusShiftLineArrow = $derived.by<ArrowSegment | null>(() => {
		if (!showPlusShiftCue) {
			return null;
		}
		return trimArrowSegment(
			{ x: toScreenX(0), y: toScreenY(0) },
			{ x: toScreenX(0), y: toScreenY(b) },
			6,
			6
		);
	});

	const rotateToAxisArcPoints = $derived.by(() =>
		reversePolylinePoints(buildThetaArcPolyline(theta, THETA_ARC_RADIUS + 0.7))
	);
	const rotateToAxisLabelX = $derived(
		toScreenX((THETA_ARC_RADIUS + 0.7) * 1.32 * Math.cos(theta / 2))
	);
	const rotateToAxisLabelY = $derived(
		toScreenY((THETA_ARC_RADIUS + 0.7) * 1.32 * Math.sin(theta / 2))
	);
	const rotateBackArcPoints = $derived.by(() => buildThetaArcPolyline(theta, THETA_ARC_RADIUS + 0.7));
	const rotateBackLabelX = $derived(toScreenX((THETA_ARC_RADIUS + 0.7) * 1.32 * Math.cos(theta / 2)));
	const rotateBackLabelY = $derived(toScreenY((THETA_ARC_RADIUS + 0.7) * 1.32 * Math.sin(theta / 2)));

	const currentLineMath = $derived.by(() => lineToTeX(currentLineSlope, currentLineIntercept));
	const originalLineMath = $derived.by(() => lineToTeX(m, b));
	const shiftedLineMath = $derived.by(() => lineToTeX(m, 0));
	const thetaMath = $derived.by(
		() => `\\theta=\\tan^{-1}(m)=\\tan^{-1}(${formatNumber(m)})\\approx ${formatNumber(theta)}`
	);
	const selectedPointMath = $derived.by(() => pointToTeX('P', originalPoint));
	const finalPointMath = $derived.by(() => pointToTeX("P'", finalReflectedPoint));
	const stepMath = $derived.by(() => {
		switch (stepIndex) {
			case 0:
				return `${pointToTeX('P', originalPoint)},\\;\\ell:${originalLineMath}`;
			case 1:
				return 'y\\leftarrow y-b';
			case 2:
				return `${pointToTeX('P_1', shiftedPoint)},\\;\\ell_1:${shiftedLineMath}`;
			case 3:
				return `${thetaMath},\\;\\text{Cue: rotate by }-\\theta`;
			case 4:
				return "P_2=R_{-\\theta}P_1,\\;\\ell_2:y=0";
			case 5:
				return `${pointToTeX('Q', rotatedPoint)},\\;${pointToTeX("Q'", reflectedRotatedPoint)},\\;Q'=(u,-v)`;
			case 6:
				return "\\text{Cue: rotate by }+\\theta";
			case 7:
				return "P_3=R_{\\theta}Q',\\;\\ell_3:y=mx";
			case 8:
				return 'y\\leftarrow y+b';
			default:
				return `${finalPointMath},\\;\\ell:${originalLineMath}`;
		}
	});

	const stepHint = $derived.by(() => {
		switch (stepIndex) {
			case 0:
				return 'Set m and b, then drag the blue point.';
			case 1:
				return 'Preview the -b move: arrows and ghosts show where the line and point will land.';
			case 2:
				return 'Line and point are shifted by -b so the line passes through the origin.';
			case 3:
				return 'Preview the -θ rotation with line and point arrows.';
			case 4:
				return 'Rotate by -θ so the mirror line becomes y=0.';
			case 5:
				return 'Reflect by flipping the y-coordinate in this rotated frame.';
			case 6:
				return 'Preview the +θ rotation back to line y=mx.';
			case 7:
				return 'Apply the +θ rotation so the mirror line returns to y=mx.';
			case 8:
				return 'Preview the +b move with line and point arrows.';
			default:
				return 'Final translated reflection in the original frame.';
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

	function rotateToXAxis(point: PlotPoint): PlotPoint {
		return {
			x: cosTheta * point.x + sinTheta * point.y,
			y: -sinTheta * point.x + cosTheta * point.y
		};
	}

	function rotateFromXAxis(point: PlotPoint): PlotPoint {
		return {
			x: cosTheta * point.x - sinTheta * point.y,
			y: sinTheta * point.x + cosTheta * point.y
		};
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

	function getLineEndpoints(slope: number, intercept: number): LineEndpoints {
		const candidates: PlotPoint[] = [];

		const yAtMinX = slope * PLOT_MIN + intercept;
		if (yAtMinX >= PLOT_MIN && yAtMinX <= PLOT_MAX) {
			candidates.push({ x: PLOT_MIN, y: yAtMinX });
		}

		const yAtMaxX = slope * PLOT_MAX + intercept;
		if (yAtMaxX >= PLOT_MIN && yAtMaxX <= PLOT_MAX) {
			candidates.push({ x: PLOT_MAX, y: yAtMaxX });
		}

		if (Math.abs(slope) > 1e-9) {
			const xAtMinY = (PLOT_MIN - intercept) / slope;
			if (xAtMinY >= PLOT_MIN && xAtMinY <= PLOT_MAX) {
				candidates.push({ x: xAtMinY, y: PLOT_MIN });
			}

			const xAtMaxY = (PLOT_MAX - intercept) / slope;
			if (xAtMaxY >= PLOT_MIN && xAtMaxY <= PLOT_MAX) {
				candidates.push({ x: xAtMaxY, y: PLOT_MAX });
			}
		}

		const unique = uniqueByDistance(candidates).sort((left, right) => left.x - right.x || left.y - right.y);
		if (unique.length >= 2) {
			return { start: unique[0], end: unique[unique.length - 1] };
		}

		return {
			start: { x: PLOT_MIN, y: slope * PLOT_MIN + intercept },
			end: { x: PLOT_MAX, y: slope * PLOT_MAX + intercept }
		};
	}

	function buildThetaArcPolyline(angle: number, radius: number) {
		const magnitude = Math.abs(angle);
		if (magnitude < 1e-5) {
			return '';
		}

		const segments = Math.max(8, Math.round((magnitude / Math.PI) * 24));
		const points: string[] = [];
		for (let index = 0; index <= segments; index += 1) {
			const t = index / segments;
			const current = angle * t;
			points.push(`${toScreenX(radius * Math.cos(current))},${toScreenY(radius * Math.sin(current))}`);
		}

		return points.join(' ');
	}

	function reversePolylinePoints(polylinePoints: string) {
		if (!polylinePoints) {
			return '';
		}
		return polylinePoints
			.trim()
			.split(/\s+/)
			.reverse()
			.join(' ');
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

		x = snap(clamp(toPlotX(svgPoint.x), POINT_MIN, POINT_MAX));
		y = snap(clamp(toPlotY(svgPoint.y), POINT_MIN, POINT_MAX));
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
				<MathExpression
					math={thetaMath}
					class="inline-block max-w-full overflow-x-auto whitespace-nowrap align-middle font-semibold text-foreground [&_.katex]:whitespace-nowrap"
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

	<div class="grid gap-3 sm:grid-cols-2">
		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			Slope m: {formatNumber(m)}
			<input
				type="range"
				min={M_MIN}
				max={M_MAX}
				step={M_STEP}
				bind:value={m}
				disabled={!canEditSetup}
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary disabled:cursor-not-allowed disabled:opacity-50"
			/>
		</label>
		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			Intercept b: {formatNumber(b)}
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
		aria-label="Step-by-step reflection of a point across y equals m x plus b"
		onpointerdown={handlePlotPointerDown}
		onpointermove={handlePlotPointerMove}
		onpointerup={stopDrag}
		onpointercancel={stopDrag}
	>
		<defs>
			<marker
				id="general-reflection-step-arrow"
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

		{#if showTheta && rotateToAxisArcPoints}
			<polyline
				points={rotateToAxisArcPoints}
				fill="none"
				stroke="#d97706"
				stroke-width="2"
				stroke-dasharray="5 4"
				stroke-linecap="round"
				stroke-linejoin="round"
				marker-end="url(#general-reflection-step-arrow)"
			/>
			<text
				x={rotateToAxisLabelX}
				y={rotateToAxisLabelY}
				class="fill-amber-700 text-[11px] font-semibold"
				text-anchor="middle"
			>
				−θ
			</text>
		{/if}

		{#if showTheta && rotateToAxisLineArrow}
			<line
				x1={rotateToAxisLineArrow.start.x}
				y1={rotateToAxisLineArrow.start.y}
				x2={rotateToAxisLineArrow.end.x}
				y2={rotateToAxisLineArrow.end.y}
				stroke="#0f766e"
				stroke-width="2"
				stroke-dasharray="5 4"
				marker-end="url(#general-reflection-step-arrow)"
			/>
			<text
				x={rotateToAxisLineArrow.mid.x + 8}
				y={rotateToAxisLineArrow.mid.y - 6}
				class="fill-teal-700 text-[10px] font-semibold"
			>
				line rotate
			</text>
		{/if}

		{#if showTheta && rotateToAxisPointArrow}
			<line
				x1={rotateToAxisPointArrow.start.x}
				y1={rotateToAxisPointArrow.start.y}
				x2={rotateToAxisPointArrow.end.x}
				y2={rotateToAxisPointArrow.end.y}
				stroke="#d97706"
				stroke-width="2"
				stroke-dasharray="6 4"
				marker-end="url(#general-reflection-step-arrow)"
			/>
			<text
				x={rotateToAxisPointArrow.mid.x + 8}
				y={rotateToAxisPointArrow.mid.y - 6}
				class="fill-amber-700 text-[10px] font-semibold"
			>
				point rotate
			</text>
		{/if}

		{#if showMinusShiftCue}
			{#if minusShiftLineArrow}
				<line
					x1={minusShiftLineArrow.start.x}
					y1={minusShiftLineArrow.start.y}
					x2={minusShiftLineArrow.end.x}
					y2={minusShiftLineArrow.end.y}
					stroke="#0f766e"
					stroke-width="2"
					stroke-dasharray="5 4"
					marker-end="url(#general-reflection-step-arrow)"
				/>
				<text
					x={minusShiftLineArrow.mid.x + 8}
					y={minusShiftLineArrow.mid.y - 6}
					class="fill-teal-700 text-[10px] font-semibold"
				>
					line −b
				</text>
			{/if}
			{#if minusShiftPointArrow}
				<line
					x1={minusShiftPointArrow.start.x}
					y1={minusShiftPointArrow.start.y}
					x2={minusShiftPointArrow.end.x}
					y2={minusShiftPointArrow.end.y}
					stroke="#1d4ed8"
					stroke-width="2"
					stroke-dasharray="6 4"
					marker-end="url(#general-reflection-step-arrow)"
				/>
				<text
					x={minusShiftPointArrow.mid.x + 8}
					y={minusShiftPointArrow.mid.y - 6}
					class="fill-blue-700 text-[10px] font-semibold"
				>
					point −b
				</text>
			{/if}
		{/if}

		{#if showRotateBackCue && rotateBackArcPoints}
			<polyline
				points={rotateBackArcPoints}
				fill="none"
				stroke="#d97706"
				stroke-width="2"
				stroke-dasharray="5 4"
				stroke-linecap="round"
				stroke-linejoin="round"
				marker-end="url(#general-reflection-step-arrow)"
			/>
			<text
				x={rotateBackLabelX}
				y={rotateBackLabelY}
				class="fill-amber-700 text-[11px] font-semibold"
				text-anchor="middle"
			>
				+θ
			</text>
		{/if}

		{#if showRotateBackCue && rotateBackPointArrow}
			<line
				x1={rotateBackPointArrow.start.x}
				y1={rotateBackPointArrow.start.y}
				x2={rotateBackPointArrow.end.x}
				y2={rotateBackPointArrow.end.y}
				stroke="#d97706"
				stroke-width="2"
				stroke-dasharray="6 4"
				marker-end="url(#general-reflection-step-arrow)"
			/>
			<text
				x={rotateBackPointArrow.mid.x + 8}
				y={rotateBackPointArrow.mid.y - 6}
				class="fill-amber-700 text-[10px] font-semibold"
			>
				rotate +θ
			</text>
		{/if}

		{#if showPlusShiftCue}
			{#if plusShiftLineArrow}
				<line
					x1={plusShiftLineArrow.start.x}
					y1={plusShiftLineArrow.start.y}
					x2={plusShiftLineArrow.end.x}
					y2={plusShiftLineArrow.end.y}
					stroke="#0f766e"
					stroke-width="2"
					stroke-dasharray="5 4"
					marker-end="url(#general-reflection-step-arrow)"
				/>
				<text
					x={plusShiftLineArrow.mid.x + 8}
					y={plusShiftLineArrow.mid.y - 6}
					class="fill-teal-700 text-[10px] font-semibold"
				>
					line +b
				</text>
			{/if}
			{#if plusShiftPointArrow}
				<line
					x1={plusShiftPointArrow.start.x}
					y1={plusShiftPointArrow.start.y}
					x2={plusShiftPointArrow.end.x}
					y2={plusShiftPointArrow.end.y}
					stroke="#1d4ed8"
					stroke-width="2"
					stroke-dasharray="6 4"
					marker-end="url(#general-reflection-step-arrow)"
				/>
				<text
					x={plusShiftPointArrow.mid.x + 8}
					y={plusShiftPointArrow.mid.y - 6}
					class="fill-blue-700 text-[10px] font-semibold"
				>
					point +b
				</text>
			{/if}
		{/if}

		{#if showReflectionStep}
			<line
				x1={rotatedPointScreenX}
				y1={rotatedPointScreenY}
				x2={rotatedPointScreenX}
				y2={axisYScreen}
				stroke="#334155"
				stroke-dasharray="4 4"
				stroke-width="1.4"
			/>
			<line
				x1={reflectedRotatedScreenX}
				y1={reflectedRotatedScreenY}
				x2={reflectedRotatedScreenX}
				y2={axisYScreen}
				stroke="#334155"
				stroke-dasharray="4 4"
				stroke-width="1.4"
			/>
			<text
				x={rotatedPointScreenX + 8}
				y={axisYScreen - 8}
				class="fill-slate-700 text-[10px] font-semibold"
			>
				d={formatNumber(Math.abs(rotatedPoint.y))}
			</text>
			{#if showSecondDistanceLabel}
				<text
					x={reflectedRotatedScreenX + 8}
					y={axisYScreen + 14}
					class="fill-slate-700 text-[10px] font-semibold"
				>
					d={formatNumber(Math.abs(rotatedPoint.y))}
				</text>
			{/if}
		{/if}

		{#if showShiftPreviewGhosts}
			<circle
				cx={shiftedPointScreenX}
				cy={shiftedPointScreenY}
				r="5.5"
				fill="#eff6ff"
				stroke="#60a5fa"
				stroke-width="1.4"
				stroke-dasharray="4 3"
			/>
			<text x={shiftedPointScreenX + 8} y={shiftedPointScreenY - 8} class="fill-blue-600 text-[10px] font-semibold">
				P1
			</text>
		{/if}

		{#if showTheta}
			<circle
				cx={rotatedPointScreenX}
				cy={rotatedPointScreenY}
				r="5.5"
				fill="#eff6ff"
				stroke="#60a5fa"
				stroke-width="1.4"
				stroke-dasharray="4 3"
			/>
			<text x={rotatedPointScreenX + 8} y={rotatedPointScreenY - 8} class="fill-blue-600 text-[10px] font-semibold">
				P2
			</text>
		{/if}

		{#if showRotateBackCue}
			<circle
				cx={unrotatedReflectedScreenX}
				cy={unrotatedReflectedScreenY}
				r="5.5"
				fill="#ecfeff"
				stroke="#14b8a6"
				stroke-width="1.4"
				stroke-dasharray="4 3"
			/>
			<text
				x={unrotatedReflectedScreenX + 8}
				y={unrotatedReflectedScreenY - 8}
				class="fill-teal-700 text-[10px] font-semibold"
			>
				P3
			</text>
		{/if}

		{#if showPlusShiftCue}
			<circle
				cx={finalReflectedScreenX}
				cy={finalReflectedScreenY}
				r="5.5"
				fill="#ecfeff"
				stroke="#14b8a6"
				stroke-width="1.4"
				stroke-dasharray="4 3"
			/>
			<text x={finalReflectedScreenX + 8} y={finalReflectedScreenY - 8} class="fill-teal-700 text-[10px] font-semibold">
				P'
			</text>
		{/if}

		{#if showOriginalReference}
			<circle cx={originalPointScreenX} cy={originalPointScreenY} r="5.5" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5" />
			<text x={originalPointScreenX + 8} y={originalPointScreenY - 8} class="fill-blue-700 text-[10px] font-semibold">
				P
			</text>
		{/if}

		{#if showReflectionStep}
			<circle cx={rotatedPointScreenX} cy={rotatedPointScreenY} r="6" fill="#2563eb" />
			<text x={rotatedPointScreenX + 8} y={rotatedPointScreenY - 8} class="fill-blue-700 text-[10px] font-semibold">
				Q
			</text>
			<circle cx={reflectedRotatedScreenX} cy={reflectedRotatedScreenY} r="6" fill="#0f766e" />
			<text
				x={reflectedRotatedScreenX + 8}
				y={reflectedRotatedScreenY - 8}
				class="fill-teal-700 text-[10px] font-semibold"
			>
				Q'
			</text>
		{:else}
			<circle
				cx={activePointScreenX}
				cy={activePointScreenY}
				r="14"
				fill="transparent"
				style={`cursor:${canEditSetup ? 'grab' : 'default'};`}
			/>
			<circle cx={activePointScreenX} cy={activePointScreenY} r="6" fill={activePointColor} style={`cursor:${canEditSetup ? 'grab' : 'default'};`} />
			<text
				x={activePointScreenX + 8}
				y={activePointScreenY - 8}
				class="fill-slate-800 text-[11px] font-semibold"
			>
				{activePointLabel}
			</text>
		{/if}

		<text
			x={toScreenX(currentLine.start.x) + 8}
			y={toScreenY(currentLine.start.y) + 14}
			class="fill-teal-700 text-[11px] font-semibold"
		>
			{lineToTeX(currentLineSlope, currentLineIntercept)}
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
