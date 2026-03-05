<script module lang="ts">
	import type { MathToolMeta } from './tool-meta';
	import { requireInteractiveToolMetaById } from './tool-registry';

	export const toolMeta: MathToolMeta = requireInteractiveToolMetaById(
		'function-tranformation-practice'
	);
</script>

<script lang="ts">
	import MathExpression from '$lib/components/math/math-expression.svelte';

	const PLOT_WIDTH = 460;
	const PLOT_HEIGHT = 460;
	const PAD_LEFT = 46;
	const PAD_RIGHT = 24;
	const PAD_TOP = 24;
	const PAD_BOTTOM = 46;
	const X_MIN = -10;
	const X_MAX = 10;
	const Y_MIN = -10;
	const Y_MAX = 10;
	const SAMPLE_STEP = 0.08;
	const SAMPLE_COUNT = Math.round((X_MAX - X_MIN) / SAMPLE_STEP);
	const JUMP_BREAK_THRESHOLD = 3;
	const SHIFT_MIN = -8;
	const SHIFT_MAX = 8;
	const SHIFT_STEP = 0.5;
	const CHECK_TOLERANCE = 0.01;
	const MAX_WRONG_CHECKS = 3;

	type ParentId =
		| 'linear'
		| 'absolute-value'
		| 'quadratic'
		| 'cubic'
		| 'square-root'
		| 'cube-root'
		| 'reciprocal'
		| 'reciprocal-squared';

	type ParentDefinition = {
		id: ParentId;
		label: string;
		fxTex: string;
		base: (u: number) => number | null;
	};

	type Challenge = {
		parentId: ParentId;
		shiftX: number;
		shiftY: number;
	};

	const parentFunctions: ParentDefinition[] = [
		{ id: 'linear', label: 'Linear', fxTex: 'x', base: (u) => u },
		{ id: 'absolute-value', label: 'Absolute Value', fxTex: '\\left|x\\right|', base: (u) => Math.abs(u) },
		{ id: 'quadratic', label: 'Quadratic', fxTex: 'x^2', base: (u) => u * u },
		{ id: 'cubic', label: 'Cubic', fxTex: 'x^3', base: (u) => u * u * u },
		{
			id: 'square-root',
			label: 'Square Root',
			fxTex: '\\sqrt{x}',
			base: (u) => (u >= 0 ? Math.sqrt(u) : null)
		},
		{ id: 'cube-root', label: 'Cube Root', fxTex: '\\sqrt[3]{x}', base: (u) => Math.cbrt(u) },
		{ id: 'reciprocal', label: 'Reciprocal', fxTex: '\\frac{1}{x}', base: (u) => (Math.abs(u) < 1e-3 ? null : 1 / u) },
		{
			id: 'reciprocal-squared',
			label: 'Reciprocal Squared',
			fxTex: '\\frac{1}{x^2}',
			base: (u) => (Math.abs(u) < 1e-3 ? null : 1 / (u * u))
		}
	];

	const parentIds = parentFunctions.map((parent) => parent.id);
	const parentById = Object.fromEntries(
		parentFunctions.map((parent) => [parent.id, parent])
	) as Record<ParentId, ParentDefinition>;
	const xTicks = Array.from({ length: 11 }, (_, index) => X_MIN + index * 2);
	const yTicks = Array.from({ length: 11 }, (_, index) => Y_MIN + index * 2);
	const innerWidth = PLOT_WIDTH - PAD_LEFT - PAD_RIGHT;
	const innerHeight = PLOT_HEIGHT - PAD_TOP - PAD_BOTTOM;

	let challenge = $state<Challenge>(createChallenge());
	let userShiftX = $state(0);
	let userShiftY = $state(0);
	let feedback = $state<{ correct: boolean; message: string } | null>(null);
	let revealTarget = $state(false);
	let attempts = $state(0);
	let solved = $state(0);
	let streak = $state(0);
	let bestStreak = $state(0);
	let wrongChecksThisCard = $state(0);
	let challengeCount = $state(1);
	let plotSvg: SVGSVGElement | null = $state(null);
	let dragging = $state(false);
	let dragStartPlotX = 0;
	let dragStartPlotY = 0;
	let dragStartShiftX = 0;
	let dragStartShiftY = 0;

	const accuracyPercent = $derived(attempts === 0 ? 0 : Math.round((solved / attempts) * 100));
	const solvedCurrentCard = $derived(Boolean(feedback?.correct));
	const targetEquationTex = $derived.by(() =>
		`y=${buildTransformedExpressionTex(challenge.parentId, challenge.shiftX, challenge.shiftY)}`
	);
	const targetPlotShiftX = $derived.by(() => -challenge.shiftX);

	const currentCurveSegments = $derived.by(() =>
		buildCurveSegments(challenge.parentId, userShiftX, userShiftY)
	);
	const targetCurveSegments = $derived.by(() =>
		buildCurveSegments(challenge.parentId, targetPlotShiftX, challenge.shiftY)
	);

	function nextRandom() {
		if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
			const randomBuffer = new Uint32Array(1);
			crypto.getRandomValues(randomBuffer);
			return randomBuffer[0] / 4294967296;
		}
		return Math.random();
	}

	function randomInt(minValue: number, maxValue: number) {
		return Math.floor(nextRandom() * (maxValue - minValue + 1)) + minValue;
	}

	function pickRandomValue<T>(values: T[]): T {
		return values[Math.floor(nextRandom() * values.length)] ?? values[0];
	}

	function shuffleValues<T>(values: T[]) {
		const shuffled = values.slice();
		for (let index = shuffled.length - 1; index > 0; index -= 1) {
			const swapIndex = Math.floor(nextRandom() * (index + 1));
			const value = shuffled[index];
			shuffled[index] = shuffled[swapIndex] ?? value;
			shuffled[swapIndex] = value;
		}
		return shuffled;
	}

	function createChallenge(): Challenge {
		const parentOrder = shuffleValues(parentIds);
		let shiftX = randomInt(-6, 6);
		let shiftY = randomInt(-6, 6);
		if (shiftX === 0 && shiftY === 0) {
			shiftY = randomInt(1, 6) * (nextRandom() < 0.5 ? 1 : -1);
		}

		return {
			parentId: parentOrder[0] ?? pickRandomValue(parentIds),
			shiftX,
			shiftY
		};
	}

	function buildTransformedExpressionTex(parentId: ParentId, shiftX: number, shiftY: number) {
		const inner = shiftArgumentTex(shiftX);
		const wrappedInner = inner === 'x' ? 'x' : `\\left(${inner}\\right)`;
		let expression = '';

		if (parentId === 'linear') {
			expression = inner;
		} else if (parentId === 'quadratic') {
			expression = `${wrappedInner}^2`;
		} else if (parentId === 'cubic') {
			expression = `${wrappedInner}^3`;
		} else if (parentId === 'square-root') {
			expression = `\\sqrt{${wrappedInner}}`;
		} else if (parentId === 'cube-root') {
			expression = `\\sqrt[3]{${wrappedInner}}`;
		} else if (parentId === 'absolute-value') {
			expression = `\\left|${wrappedInner}\\right|`;
		} else if (parentId === 'reciprocal') {
			expression = `\\frac{1}{${wrappedInner}}`;
		} else {
			expression = `\\frac{1}{${wrappedInner}^2}`;
		}

		if (shiftY === 0) {
			return expression;
		}
		return `${expression}${shiftY > 0 ? `+${shiftY}` : `${shiftY}`}`;
	}

	function shiftArgumentTex(value: number) {
		if (value === 0) {
			return 'x';
		}
		return value > 0 ? `x+${value}` : `x${value}`;
	}

	function clamp(value: number, minValue: number, maxValue: number) {
		return Math.min(maxValue, Math.max(minValue, value));
	}

	function snapShift(value: number) {
		return Math.round(value / SHIFT_STEP) * SHIFT_STEP;
	}

	function toSvgX(x: number) {
		return PAD_LEFT + ((x - X_MIN) / (X_MAX - X_MIN)) * innerWidth;
	}

	function toSvgY(y: number) {
		return PAD_TOP + ((Y_MAX - y) / (Y_MAX - Y_MIN)) * innerHeight;
	}

	function toPlotX(svgX: number) {
		return X_MIN + ((svgX - PAD_LEFT) / innerWidth) * (X_MAX - X_MIN);
	}

	function toPlotY(svgY: number) {
		return Y_MAX - ((svgY - PAD_TOP) / innerHeight) * (Y_MAX - Y_MIN);
	}

	function pointerToPlotPoint(event: PointerEvent) {
		if (!plotSvg) {
			return null;
		}

		const rect = plotSvg.getBoundingClientRect();
		if (rect.width === 0 || rect.height === 0) {
			return null;
		}

		const rawX = ((event.clientX - rect.left) / rect.width) * PLOT_WIDTH;
		const rawY = ((event.clientY - rect.top) / rect.height) * PLOT_HEIGHT;
		const svgX = clamp(rawX, PAD_LEFT, PAD_LEFT + innerWidth);
		const svgY = clamp(rawY, PAD_TOP, PAD_TOP + innerHeight);

		return {
			x: toPlotX(svgX),
			y: toPlotY(svgY)
		};
	}

	function evaluateShifted(parentId: ParentId, x: number, shiftX: number, shiftY: number) {
		const baseValue = parentById[parentId].base(x - shiftX);
		if (baseValue === null || !Number.isFinite(baseValue)) {
			return null;
		}
		return baseValue + shiftY;
	}

	function isInsidePlotY(y: number) {
		return y >= Y_MIN && y <= Y_MAX;
	}

	function interpolateXAtY(x1: number, y1: number, x2: number, y2: number, targetY: number) {
		const deltaY = y2 - y1;
		if (Math.abs(deltaY) < 1e-9) {
			return x2;
		}
		const t = (targetY - y1) / deltaY;
		return x1 + t * (x2 - x1);
	}

	function buildCurveSegments(parentId: ParentId, shiftX: number, shiftY: number) {
		const segments: string[] = [];
		let activeSegment: string[] = [];
		let previousPoint: { x: number; y: number } | null = null;

		const flushSegment = () => {
			if (activeSegment.length > 1) {
				segments.push(activeSegment.join(' '));
			}
			activeSegment = [];
		};

		const addPoint = (x: number, y: number) => {
			activeSegment.push(`${toSvgX(x).toFixed(2)},${toSvgY(y).toFixed(2)}`);
		};

		for (let sampleIndex = 0; sampleIndex <= SAMPLE_COUNT; sampleIndex += 1) {
			const x = X_MIN + sampleIndex * SAMPLE_STEP;
			const y = evaluateShifted(parentId, x, shiftX, shiftY);

			if (y === null || !Number.isFinite(y)) {
				flushSegment();
				previousPoint = null;
				continue;
			}

			if (previousPoint === null) {
				previousPoint = { x, y };
				if (isInsidePlotY(y)) {
					addPoint(x, y);
				}
				continue;
			}

			if (Math.abs(y - previousPoint.y) > JUMP_BREAK_THRESHOLD) {
				flushSegment();
				previousPoint = { x, y };
				if (isInsidePlotY(y)) {
					addPoint(x, y);
				}
				continue;
			}

			const previousInside = isInsidePlotY(previousPoint.y);
			const currentInside = isInsidePlotY(y);

			if (previousInside && currentInside) {
				if (activeSegment.length === 0) {
					addPoint(previousPoint.x, previousPoint.y);
				}
				addPoint(x, y);
			} else if (previousInside && !currentInside) {
				const boundaryY = y > Y_MAX ? Y_MAX : Y_MIN;
				const boundaryX = interpolateXAtY(previousPoint.x, previousPoint.y, x, y, boundaryY);
				if (activeSegment.length === 0) {
					addPoint(previousPoint.x, previousPoint.y);
				}
				addPoint(boundaryX, boundaryY);
				flushSegment();
			} else if (!previousInside && currentInside) {
				const boundaryY = previousPoint.y > Y_MAX ? Y_MAX : Y_MIN;
				const boundaryX = interpolateXAtY(previousPoint.x, previousPoint.y, x, y, boundaryY);
				addPoint(boundaryX, boundaryY);
				addPoint(x, y);
			} else {
				const previousAbove = previousPoint.y > Y_MAX;
				const currentAbove = y > Y_MAX;
				if (previousAbove !== currentAbove) {
					const xAtMin = interpolateXAtY(previousPoint.x, previousPoint.y, x, y, Y_MIN);
					const xAtMax = interpolateXAtY(previousPoint.x, previousPoint.y, x, y, Y_MAX);
					if (xAtMin <= xAtMax) {
						addPoint(xAtMin, Y_MIN);
						addPoint(xAtMax, Y_MAX);
					} else {
						addPoint(xAtMax, Y_MAX);
						addPoint(xAtMin, Y_MIN);
					}
					flushSegment();
				} else {
					flushSegment();
				}
			}

			previousPoint = { x, y };
		}

		flushSegment();
		return segments;
	}

	function handlePlotPointerDown(event: PointerEvent) {
		const point = pointerToPlotPoint(event);
		if (!point) {
			return;
		}

		event.preventDefault();
		dragging = true;
		dragStartPlotX = point.x;
		dragStartPlotY = point.y;
		dragStartShiftX = userShiftX;
		dragStartShiftY = userShiftY;
		plotSvg?.setPointerCapture(event.pointerId);
	}

	function handlePlotPointerMove(event: PointerEvent) {
		if (!dragging) {
			return;
		}

		event.preventDefault();
		const point = pointerToPlotPoint(event);
		if (!point) {
			return;
		}

		const deltaX = point.x - dragStartPlotX;
		const deltaY = point.y - dragStartPlotY;
		userShiftX = snapShift(clamp(dragStartShiftX + deltaX, SHIFT_MIN, SHIFT_MAX));
		userShiftY = snapShift(clamp(dragStartShiftY + deltaY, SHIFT_MIN, SHIFT_MAX));
		feedback = null;
	}

	function stopDrag(event: PointerEvent) {
		if (!dragging) {
			return;
		}
		dragging = false;
		if (plotSvg?.hasPointerCapture(event.pointerId)) {
			plotSvg.releasePointerCapture(event.pointerId);
		}
	}

	function resetPlacement() {
		userShiftX = 0;
		userShiftY = 0;
		feedback = null;
	}

	function nextChallenge() {
		challenge = createChallenge();
		userShiftX = 0;
		userShiftY = 0;
		feedback = null;
		revealTarget = false;
		wrongChecksThisCard = 0;
		challengeCount += 1;
	}

	function checkPlacement() {
		attempts += 1;

		const xError = Math.abs(userShiftX - targetPlotShiftX);
		const yError = Math.abs(userShiftY - challenge.shiftY);
		const isCorrect = xError <= CHECK_TOLERANCE && yError <= CHECK_TOLERANCE;

		if (isCorrect) {
			solved += 1;
			streak += 1;
			bestStreak = Math.max(bestStreak, streak);
			feedback = {
				correct: true,
				message: 'Correct.'
			};
			return;
		}

		wrongChecksThisCard = Math.min(MAX_WRONG_CHECKS, wrongChecksThisCard + 1);
		if (wrongChecksThisCard >= MAX_WRONG_CHECKS) {
			streak = 0;
			revealTarget = true;
			feedback = {
				correct: false,
				message: 'Not quite. The answer is now shown.'
			};
			return;
		}

		feedback = {
			correct: false,
			message:
				wrongChecksThisCard === MAX_WRONG_CHECKS - 1
					? 'Not quite. One more attempt until the answer is revealed.'
					: 'Not quite. Adjust the graph and try again.'
		};
	}
</script>

<div class="space-y-4 select-none">
	<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Card: <span class="font-semibold text-foreground">#{challengeCount}</span>
		</p>
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Correct: <span class="font-semibold text-foreground">{solved}/{attempts}</span>
		</p>
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Accuracy: <span class="font-semibold text-foreground">{accuracyPercent}%</span>
		</p>
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Streak: <span class="font-semibold text-foreground">{streak}</span>
			<span class="ml-1 text-xs text-muted-foreground">(best {bestStreak})</span>
		</p>
	</div>

	<div class="space-y-3 rounded-xl border border-border/70 bg-background/75 p-3">
		<p class="text-sm text-muted-foreground">
			Target transformation:
			<MathExpression
				math={targetEquationTex}
				class="ml-1 inline-block align-middle font-semibold text-foreground"
			/>
		</p>
	</div>

	<div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,15.5rem)]">
		<svg
			bind:this={plotSvg}
			viewBox={`0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`}
			class="h-auto w-full max-w-[28rem] rounded-xl border border-border/70 bg-white touch-none lg:max-w-none"
			role="img"
			aria-label="Drag the parent function graph to match the target transformation"
			onpointerdown={handlePlotPointerDown}
			onpointermove={handlePlotPointerMove}
			onpointerup={stopDrag}
			onpointercancel={stopDrag}
		>
			<rect x={PAD_LEFT} y={PAD_TOP} width={innerWidth} height={innerHeight} fill="white" />

			{#each yTicks as tick (tick)}
				<line
					x1={PAD_LEFT}
					y1={toSvgY(tick)}
					x2={PAD_LEFT + innerWidth}
					y2={toSvgY(tick)}
					stroke={tick === 0 ? '#94a3b8' : '#e2e8f0'}
					stroke-width={tick === 0 ? '1.4' : '1'}
				/>
				<text x={PAD_LEFT - 8} y={toSvgY(tick) + 4} text-anchor="end" font-size="10" fill="#64748b">
					{tick}
				</text>
			{/each}

			{#each xTicks as tick (tick)}
				<line
					x1={toSvgX(tick)}
					y1={PAD_TOP}
					x2={toSvgX(tick)}
					y2={PAD_TOP + innerHeight}
					stroke={tick === 0 ? '#94a3b8' : '#e2e8f0'}
					stroke-width={tick === 0 ? '1.4' : '1'}
				/>
				<text x={toSvgX(tick)} y={PAD_TOP + innerHeight + 15} text-anchor="middle" font-size="10" fill="#64748b">
					{tick}
				</text>
			{/each}

			{#if revealTarget}
				{#each targetCurveSegments as segment (segment)}
					<polyline
						points={segment}
						fill="none"
						stroke="#f97316"
						stroke-width="2.2"
						stroke-dasharray="6 4"
						stroke-linejoin="round"
						stroke-linecap="round"
					/>
				{/each}
			{/if}

			{#each currentCurveSegments as segment (segment)}
				<polyline
					points={segment}
					fill="none"
					stroke="#0f766e"
					stroke-width="2.8"
					stroke-linejoin="round"
					stroke-linecap="round"
				/>
			{/each}
			<circle
				cx={toSvgX(userShiftX)}
				cy={toSvgY(userShiftY)}
				r="3.5"
				fill="#f97316"
			/>

			<text x={PLOT_WIDTH - 12} y={toSvgY(0) - 8} text-anchor="end" font-size="11" fill="#64748b">x</text>
			<text x={toSvgX(0) + 10} y={PAD_TOP + 11} text-anchor="start" font-size="11" fill="#64748b">y</text>
		</svg>

		<div class="space-y-3">
			<p class="rounded-xl border border-border/70 bg-background/75 px-3 py-2 text-xs text-muted-foreground">
				Drag the graph to match the target transformation. You get <span class="font-semibold text-foreground">3 attempts</span>
				before the answer appears. The dot starts at <span class="font-semibold text-foreground">(0,0)</span>
				and moves with the graph.
			</p>

			<div class="grid gap-2">
				<button
					type="button"
					class="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/8"
					onclick={resetPlacement}
				>
					Reset
				</button>
				{#if solvedCurrentCard}
					<button
						type="button"
						class="rounded-lg border border-primary/45 bg-primary/12 px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary/60 hover:bg-primary/20"
						onclick={nextChallenge}
					>
						Next card
					</button>
				{:else}
					<button
						type="button"
						class="rounded-lg border border-primary/45 bg-primary/12 px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary/60 hover:bg-primary/20"
						onclick={checkPlacement}
					>
						Check
					</button>
				{/if}
			</div>

			{#if feedback}
				<p
					class={`rounded-xl border px-3 py-2 text-sm ${
						feedback.correct
							? 'border-emerald-500/55 bg-emerald-100/70 text-emerald-900'
							: 'border-rose-500/55 bg-rose-100/70 text-rose-900'
					}`}
				>
					{feedback.message}
				</p>
			{/if}
		</div>
	</div>
</div>
