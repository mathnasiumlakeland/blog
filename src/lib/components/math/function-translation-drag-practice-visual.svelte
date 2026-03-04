<script module lang="ts">
	import type { MathToolMeta } from './tool-meta';
	import { requireInteractiveToolMetaById } from './tool-registry';

	export const toolMeta: MathToolMeta = requireInteractiveToolMetaById(
		'function-translation-drag-practice'
	);
</script>

<script lang="ts">
	import MathExpression from '$lib/components/math/math-expression.svelte';

	const PLOT_WIDTH = 680;
	const PLOT_HEIGHT = 360;
	const PAD_LEFT = 56;
	const PAD_RIGHT = 20;
	const PAD_TOP = 20;
	const PAD_BOTTOM = 40;
	const X_MIN = -10;
	const X_MAX = 10;
	const Y_MIN = -10;
	const Y_MAX = 10;
	const SAMPLE_STEP = 0.08;
	const CLIP_MARGIN = 3;
	const JUMP_BREAK_THRESHOLD = 3;
	const SHIFT_MIN = -8;
	const SHIFT_MAX = 8;
	const SHIFT_STEP = 0.5;
	const CHECK_TOLERANCE = 0.01;

	type ParentId =
		| 'linear'
		| 'absolute-value'
		| 'quadratic'
		| 'cubic'
		| 'square-root'
		| 'cube-root'
		| 'reciprocal'
		| 'reciprocal-squared';

	type ChallengeType = 'vertical' | 'horizontal';

	type ParentDefinition = {
		id: ParentId;
		label: string;
		fxTex: string;
		base: (u: number) => number | null;
	};

	type Challenge = {
		type: ChallengeType;
		parentId: ParentId;
		b: number;
		targetShiftX: number;
		targetShiftY: number;
	};

	const parentFunctions: ParentDefinition[] = [
		{ id: 'linear', label: 'Linear', fxTex: 'x', base: (u) => u },
		{ id: 'absolute-value', label: 'Absolute Value', fxTex: '\\left|x\\right|', base: (u) => Math.abs(u) },
		{ id: 'quadratic', label: 'Quadratic', fxTex: 'x^2', base: (u) => u * u },
		{ id: 'cubic', label: 'Cubic', fxTex: 'x^3', base: (u) => u * u * u },
		{ id: 'square-root', label: 'Square Root', fxTex: '\\sqrt{x}', base: (u) => (u >= 0 ? Math.sqrt(u) : null) },
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

	let rngSeed = 20260303;
	let challenge = $state<Challenge>(createChallenge());
	let userShiftX = $state(0);
	let userShiftY = $state(0);
	let feedback = $state<{ correct: boolean; message: string } | null>(null);
	let revealTarget = $state(false);
	let attempts = $state(0);
	let solved = $state(0);
	let challengeCount = $state(1);
	let plotSvg: SVGSVGElement | null = $state(null);
	let dragging = $state(false);
	let dragStartPlotX = 0;
	let dragStartPlotY = 0;
	let dragStartShiftX = 0;
	let dragStartShiftY = 0;

	const activeParent = $derived(parentById[challenge.parentId]);
	const accuracyPercent = $derived(attempts === 0 ? 0 : Math.round((solved / attempts) * 100));
	const targetEquationTex = $derived.by(() => {
		if (challenge.type === 'vertical') {
			return `y=f(x)${signedValueTex(challenge.b)}`;
		}
		return `y=f\\left(${xShiftArgumentTex(challenge.b)}\\right)`;
	});
	const fDefinitionTex = $derived.by(() => `f(x)=${activeParent.fxTex}`);
	const activeShiftModeLabel = $derived(
		challenge.type === 'vertical' ? 'Vertical drag mode' : 'Horizontal drag mode'
	);
	const targetDirectionHint = $derived.by(() => {
		if (challenge.type === 'vertical') {
			if (challenge.b > 0) return `Move up ${formatShift(challenge.b)} units.`;
			return `Move down ${formatShift(Math.abs(challenge.b))} units.`;
		}
		if (challenge.b > 0) return `For f(x+${challenge.b}), move left ${formatShift(challenge.b)} units.`;
		return `For f(x${challenge.b}), move right ${formatShift(Math.abs(challenge.b))} units.`;
	});
	const currentShiftSummaryTex = $derived.by(
		() => `\\Delta x=${formatShift(userShiftX)},\\;\\Delta y=${formatShift(userShiftY)}`
	);

	const currentCurveSegments = $derived.by(() =>
		buildCurveSegments(challenge.parentId, userShiftX, userShiftY)
	);
	const targetCurveSegments = $derived.by(() =>
		buildCurveSegments(challenge.parentId, challenge.targetShiftX, challenge.targetShiftY)
	);

	function nextRandom() {
		rngSeed = (rngSeed * 1664525 + 1013904223) >>> 0;
		return rngSeed / 4294967296;
	}

	function randomInt(minValue: number, maxValue: number) {
		return Math.floor(nextRandom() * (maxValue - minValue + 1)) + minValue;
	}

	function pickRandomValue<T>(values: T[]): T {
		return values[Math.floor(nextRandom() * values.length)] ?? values[0];
	}

	function createChallenge(): Challenge {
		const type: ChallengeType = pickRandomValue(['vertical', 'horizontal']);
		const parentId = pickRandomValue(parentIds);
		let b = randomInt(-5, 5);
		if (b === 0) {
			b = randomInt(1, 5) * (nextRandom() < 0.5 ? -1 : 1);
		}

		return {
			type,
			parentId,
			b,
			targetShiftX: type === 'horizontal' ? -b : 0,
			targetShiftY: type === 'vertical' ? b : 0
		};
	}

	function signedValueTex(value: number) {
		if (value === 0) return '';
		return value > 0 ? `+${value}` : `${value}`;
	}

	function xShiftArgumentTex(value: number) {
		if (value === 0) return 'x';
		return value > 0 ? `x+${value}` : `x${value}`;
	}

	function clamp(value: number, minValue: number, maxValue: number) {
		return Math.min(maxValue, Math.max(minValue, value));
	}

	function snapShift(value: number) {
		return Math.round(value / SHIFT_STEP) * SHIFT_STEP;
	}

	function formatShift(value: number) {
		return Number.isInteger(value) ? value.toString() : value.toFixed(1);
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

	function buildCurveSegments(parentId: ParentId, shiftX: number, shiftY: number) {
		const segments: string[] = [];
		let activeSegment: string[] = [];
		let previousY: number | null = null;

		const flushSegment = () => {
			if (activeSegment.length > 1) {
				segments.push(activeSegment.join(' '));
			}
			activeSegment = [];
			previousY = null;
		};

		for (let x = X_MIN; x <= X_MAX + SAMPLE_STEP / 2; x += SAMPLE_STEP) {
			const y = evaluateShifted(parentId, x, shiftX, shiftY);
			if (y === null || !Number.isFinite(y) || y < Y_MIN - CLIP_MARGIN || y > Y_MAX + CLIP_MARGIN) {
				flushSegment();
				continue;
			}

			if (previousY !== null && Math.abs(y - previousY) > JUMP_BREAK_THRESHOLD) {
				flushSegment();
			}

			activeSegment.push(`${toSvgX(x).toFixed(2)},${toSvgY(y).toFixed(2)}`);
			previousY = y;
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

		if (challenge.type === 'vertical') {
			userShiftY = snapShift(clamp(dragStartShiftY + deltaY, SHIFT_MIN, SHIFT_MAX));
			userShiftX = 0;
		} else {
			userShiftX = snapShift(clamp(dragStartShiftX + deltaX, SHIFT_MIN, SHIFT_MAX));
			userShiftY = 0;
		}
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
		revealTarget = false;
	}

	function nextChallenge() {
		challenge = createChallenge();
		resetPlacement();
		challengeCount += 1;
	}

	function checkPlacement() {
		attempts += 1;
		revealTarget = true;

		const xError = Math.abs(userShiftX - challenge.targetShiftX);
		const yError = Math.abs(userShiftY - challenge.targetShiftY);
		const isCorrect = xError <= CHECK_TOLERANCE && yError <= CHECK_TOLERANCE;

		if (isCorrect) {
			solved += 1;
			feedback = {
				correct: true,
				message: 'Correct placement.'
			};
			return;
		}

		if (challenge.type === 'vertical') {
			feedback = {
				correct: false,
				message: `Not yet. You placed \\u0394y=${formatShift(userShiftY)}, but target \\u0394y=${formatShift(challenge.targetShiftY)}.`
			};
			return;
		}

		feedback = {
			correct: false,
			message: `Not yet. You placed \\u0394x=${formatShift(userShiftX)}, but target \\u0394x=${formatShift(challenge.targetShiftX)}.`
		};
	}
</script>

<div class="space-y-4 select-none">
	<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Challenge: <span class="font-semibold text-foreground">#{challengeCount}</span>
		</p>
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Solved: <span class="font-semibold text-foreground">{solved}/{attempts}</span>
		</p>
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Accuracy: <span class="font-semibold text-foreground">{accuracyPercent}%</span>
		</p>
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Mode: <span class="font-semibold text-foreground">{activeShiftModeLabel}</span>
		</p>
	</div>

	<div class="space-y-3 rounded-xl border border-border/70 bg-background/75 p-3">
		<p class="text-sm text-muted-foreground">
			Parent function:
			<MathExpression
				math={fDefinitionTex}
				class="ml-1 inline-block align-middle font-semibold text-foreground"
			/>
		</p>
		<p class="text-sm text-muted-foreground">
			Target transformation:
			<MathExpression
				math={targetEquationTex}
				class="ml-1 inline-block align-middle font-semibold text-foreground"
			/>
		</p>
		<p class="text-sm text-muted-foreground">
			{targetDirectionHint}
		</p>
		<p class="text-sm text-muted-foreground">
			Current placement:
			<MathExpression
				math={currentShiftSummaryTex}
				class="ml-1 inline-block align-middle font-semibold text-foreground"
			/>
		</p>
	</div>

	<svg
		bind:this={plotSvg}
		viewBox={`0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`}
		class="h-auto w-full rounded-xl border border-border/70 bg-white touch-none"
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

		<text x={PLOT_WIDTH - 12} y={toSvgY(0) - 8} text-anchor="end" font-size="11" fill="#64748b">x</text>
		<text x={toSvgX(0) + 10} y={PAD_TOP + 11} text-anchor="start" font-size="11" fill="#64748b">y</text>
	</svg>

	<div class="grid gap-3 sm:grid-cols-2">
		<label class="space-y-1 rounded-xl border border-border/70 bg-background/75 px-3 py-2 text-xs font-medium text-muted-foreground">
			{#if challenge.type === 'vertical'}
				Vertical shift (\u0394y)
				<input
					type="range"
					min={SHIFT_MIN}
					max={SHIFT_MAX}
					step={SHIFT_STEP}
					bind:value={userShiftY}
					oninput={() => {
						userShiftX = 0;
						feedback = null;
					}}
					class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
				/>
				<span class="text-sm font-semibold text-foreground">{formatShift(userShiftY)}</span>
			{:else}
				Horizontal shift (\u0394x)
				<input
					type="range"
					min={SHIFT_MIN}
					max={SHIFT_MAX}
					step={SHIFT_STEP}
					bind:value={userShiftX}
					oninput={() => {
						userShiftY = 0;
						feedback = null;
					}}
					class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
				/>
				<span class="text-sm font-semibold text-foreground">{formatShift(userShiftX)}</span>
			{/if}
		</label>
		<p class="rounded-xl border border-border/70 bg-background/75 px-3 py-2 text-xs text-muted-foreground">
			Drag directly on the graph to move the curve. In this mode, only one axis is active.
			Use <span class="font-semibold text-foreground">Check</span> to reveal the target (orange dashed).
		</p>
	</div>

	<div class="flex flex-wrap items-center gap-2">
		<button
			type="button"
			class="rounded-lg border border-primary/45 bg-primary/12 px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary/60 hover:bg-primary/20"
			onclick={checkPlacement}
		>
			Check
		</button>
		<button
			type="button"
			class="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/8"
			onclick={resetPlacement}
		>
			Reset
		</button>
		<button
			type="button"
			class="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/8"
			onclick={nextChallenge}
		>
			New challenge
		</button>
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
