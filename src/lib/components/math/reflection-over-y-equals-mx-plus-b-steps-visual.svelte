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

	const steps = [
		'Choose P and y=mx+b',
		'Show shift cue: -b',
		'Apply vertical shift',
		'Show angle θ',
		'Rotate to y=0',
		'Reflect across y=0',
		'Rotate back',
		'Show shift cue: +b',
		'Translate back'
	] as const;

	let m = $state(1);
	let b = $state(2);
	let x = $state(3);
	let y = $state(5);
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

	const showMinusShiftCue = $derived(stepIndex === 1 && Math.abs(b) > 1e-9);
	const showPlusShiftCue = $derived(stepIndex === 7 && Math.abs(b) > 1e-9);
	const showTheta = $derived(stepIndex === 3);
	const showReflectionStep = $derived(stepIndex === 5);
	const showShiftedGhosts = $derived(stepIndex === 2);
	const showFinalTranslationGhosts = $derived(stepIndex === 8);
	const showOriginalReference = $derived(stepIndex >= 2);
	const showSecondDistanceLabel = $derived(Math.abs(rotatedPoint.y) >= DISTANCE_LABEL_HIDE_THRESHOLD);

	const currentLineSlope = $derived.by(() => {
		if (stepIndex === 4 || stepIndex === 5) {
			return 0;
		}
		return m;
	});
	const currentLineIntercept = $derived.by(() => {
		if (stepIndex <= 1 || stepIndex === 8) {
			return b;
		}
		return 0;
	});
	const currentLine = $derived.by(() => getLineEndpoints(currentLineSlope, currentLineIntercept));

	const ghostLine = $derived.by<LineEndpoints | null>(() => {
		if (showShiftedGhosts) {
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
		if (stepIndex <= 7) {
			return unrotatedReflectedPoint;
		}
		return finalReflectedPoint;
	});

	const activePointColor = $derived(stepIndex >= 5 ? '#0f766e' : '#2563eb');
	const activePointLabel = $derived.by(() => {
		if (stepIndex <= 4) {
			return 'P';
		}
		return "P'";
	});

	const activePointScreenX = $derived(toScreenX(activePoint.x));
	const activePointScreenY = $derived(toScreenY(activePoint.y));
	const originalPointScreenX = $derived(toScreenX(originalPoint.x));
	const originalPointScreenY = $derived(toScreenY(originalPoint.y));
	const rotatedPointScreenX = $derived(toScreenX(rotatedPoint.x));
	const rotatedPointScreenY = $derived(toScreenY(rotatedPoint.y));
	const reflectedRotatedScreenX = $derived(toScreenX(reflectedRotatedPoint.x));
	const reflectedRotatedScreenY = $derived(toScreenY(reflectedRotatedPoint.y));
	const axisYScreen = $derived(toScreenY(0));

	const thetaArcPoints = $derived.by(() => buildThetaArcPolyline(theta, THETA_ARC_RADIUS));
	const thetaLabelX = $derived(toScreenX(THETA_ARC_RADIUS * 1.32 * Math.cos(theta / 2)));
	const thetaLabelY = $derived(toScreenY(THETA_ARC_RADIUS * 1.32 * Math.sin(theta / 2)));

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
				return thetaMath;
			case 4:
				return "P_2=R_{-\\theta}P_1,\\;\\ell_2:y=0";
			case 5:
				return `${pointToTeX('Q', rotatedPoint)},\\;${pointToTeX("Q'", reflectedRotatedPoint)},\\;Q'=(u,-v)`;
			case 6:
				return "P_3=R_{\\theta}Q'";
			case 7:
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
				return 'Cue only: subtract b from every y-value.';
			case 2:
				return 'Line and point are shifted by -b so the line passes through the origin.';
			case 3:
				return 'Measure θ between the x-axis and y=mx.';
			case 4:
				return 'Rotate by -θ so the mirror line becomes y=0.';
			case 5:
				return 'Reflect by flipping the y-coordinate in this rotated frame.';
			case 6:
				return 'Rotate back by +θ.';
			case 7:
				return 'Cue only: add b back to y-values.';
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
	<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
		<p class="rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
			Step:
			<span class="ml-1 font-semibold text-foreground">{stepIndex + 1}/{steps.length}</span>
			<span class="mt-1 block text-xs text-foreground/85">{steps[stepIndex]}</span>
		</p>
		<p class="rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
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
		<p class="rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
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
		<p class="rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
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

		{#if showTheta && thetaArcPoints}
			<polyline
				points={thetaArcPoints}
				fill="none"
				stroke="#d97706"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<text x={thetaLabelX} y={thetaLabelY} class="fill-amber-700 text-[11px] font-semibold" text-anchor="middle">
				θ
			</text>
		{/if}

		{#if showMinusShiftCue}
			<line
				x1={b > 0 ? toScreenX(3) : toScreenX(-3)}
				y1={toScreenY(8.7)}
				x2={b > 0 ? toScreenX(-3) : toScreenX(3)}
				y2={toScreenY(8.7)}
				stroke="#1d4ed8"
				stroke-width="2"
				marker-end="url(#general-reflection-step-arrow)"
			/>
			<text
				x={toScreenX(0)}
				y={toScreenY(9.2)}
				class="fill-blue-700 text-[10px] font-semibold"
				text-anchor="middle"
			>
				−b shift cue
			</text>
		{/if}

		{#if showPlusShiftCue}
			<line
				x1={b > 0 ? toScreenX(-3) : toScreenX(3)}
				y1={toScreenY(8.7)}
				x2={b > 0 ? toScreenX(3) : toScreenX(-3)}
				y2={toScreenY(8.7)}
				stroke="#1d4ed8"
				stroke-width="2"
				marker-end="url(#general-reflection-step-arrow)"
			/>
			<text
				x={toScreenX(0)}
				y={toScreenY(9.2)}
				class="fill-blue-700 text-[10px] font-semibold"
				text-anchor="middle"
			>
				+b shift cue
			</text>
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
