<script module lang="ts">
	import type { MathToolMeta } from './tool-meta';
	import { requireInteractiveToolMetaById } from './tool-registry';

	export const toolMeta: MathToolMeta = requireInteractiveToolMetaById(
		'parent-function-identification'
	);
</script>

<script lang="ts">
	import MathExpression from '$lib/components/math/math-expression.svelte';
	import { slide } from 'svelte/transition';

	const PLOT_WIDTH = 480;
	const PLOT_HEIGHT = 480;
	const PAD_LEFT = 56;
	const PAD_RIGHT = 24;
	const PAD_TOP = 24;
	const PAD_BOTTOM = 56;
	const X_MIN = -10;
	const X_MAX = 10;
	const Y_MIN = -10;
	const Y_MAX = 10;
	const SAMPLE_STEP = 0.08;
	const SAMPLE_COUNT = Math.round((X_MAX - X_MIN) / SAMPLE_STEP);
	const JUMP_BREAK_THRESHOLD = 3;

	const innerWidth = PLOT_WIDTH - PAD_LEFT - PAD_RIGHT;
	const innerHeight = PLOT_HEIGHT - PAD_TOP - PAD_BOTTOM;
	const xTicks = Array.from({ length: 11 }, (_, index) => X_MIN + index * 2);
	const yTicks = Array.from({ length: 11 }, (_, index) => Y_MIN + index * 2);

	type ParentId =
		| 'quadratic'
		| 'cubic'
		| 'linear'
		| 'square-root'
		| 'cube-root'
		| 'absolute-value'
		| 'reciprocal'
		| 'reciprocal-squared';

	type ParentDefinition = {
		id: ParentId;
		label: string;
		parentTex: string;
		base: (u: number) => number | null;
	};

	type ParentConfig = {
		aValues: number[];
		hRange: [number, number];
		kRange: [number, number];
	};

	type FlashCard = {
		parentId: ParentId;
		a: number;
		h: number;
		k: number;
		optionOrder: ParentId[];
	};

	const parentFunctions: ParentDefinition[] = [
		{
			id: 'quadratic',
			label: 'Quadratic',
			parentTex: 'y=x^2',
			base: (u) => u * u
		},
		{
			id: 'cubic',
			label: 'Cubic',
			parentTex: 'y=x^3',
			base: (u) => u * u * u
		},
		{
			id: 'linear',
			label: 'Linear',
			parentTex: 'y=x',
			base: (u) => u
		},
		{
			id: 'square-root',
			label: 'Square Root',
			parentTex: 'y=\\sqrt{x}',
			base: (u) => (u >= 0 ? Math.sqrt(u) : null)
		},
		{
			id: 'cube-root',
			label: 'Cube Root',
			parentTex: 'y=\\sqrt[3]{x}',
			base: (u) => Math.cbrt(u)
		},
		{
			id: 'absolute-value',
			label: 'Absolute Value',
			parentTex: 'y=\\left|x\\right|',
			base: (u) => Math.abs(u)
		},
		{
			id: 'reciprocal',
			label: 'Reciprocal',
			parentTex: 'y=\\frac{1}{x}',
			base: (u) => (Math.abs(u) < 1e-3 ? null : 1 / u)
		},
		{
			id: 'reciprocal-squared',
			label: 'Reciprocal Squared',
			parentTex: 'y=\\frac{1}{x^2}',
			base: (u) => (Math.abs(u) < 1e-3 ? null : 1 / (u * u))
		}
	];

	const parentConfigs: Record<ParentId, ParentConfig> = {
		quadratic: { aValues: [-2, -1, 1, 2], hRange: [-4, 4], kRange: [-4, 4] },
		cubic: { aValues: [-2, -1, 1, 2], hRange: [-4, 4], kRange: [-4, 4] },
		linear: { aValues: [-3, -2, -1, 1, 2, 3], hRange: [-4, 4], kRange: [-4, 4] },
		'square-root': { aValues: [-3, -2, -1, 1, 2, 3], hRange: [-8, 4], kRange: [-4, 4] },
		'cube-root': { aValues: [-3, -2, -1, 1, 2, 3], hRange: [-5, 5], kRange: [-4, 4] },
		'absolute-value': { aValues: [-3, -2, -1, 1, 2, 3], hRange: [-5, 5], kRange: [-4, 4] },
		reciprocal: { aValues: [-4, -3, -2, -1, 1, 2, 3, 4], hRange: [-5, 5], kRange: [-4, 4] },
		'reciprocal-squared': {
			aValues: [-4, -3, -2, -1, 1, 2, 3, 4],
			hRange: [-5, 5],
			kRange: [-4, 2]
		}
	};

	const parentIds = parentFunctions.map((parent) => parent.id);
	const parentById = Object.fromEntries(
		parentFunctions.map((parent) => [parent.id, parent])
	) as Record<ParentId, ParentDefinition>;
	const answerOptionOrder: ParentId[] = [
		'linear',
		'absolute-value',
		'quadratic',
		'cubic',
		'square-root',
		'cube-root',
		'reciprocal',
		'reciprocal-squared'
	];

	let attempts = $state(0);
	let correctCount = $state(0);
	let streak = $state(0);
	let bestStreak = $state(0);
	let cardNumber = $state(1);
	let selectedParent = $state<ParentId | null>(null);
	let incorrectGuesses = $state<ParentId[]>([]);
	let lastIncorrectGuess = $state<ParentId | null>(null);
	let card = $state<FlashCard>(createRandomCard());

	const activeParent = $derived(parentById[card.parentId]);
	const isCorrectGuess = $derived(selectedParent === card.parentId);
	const accuracyPercent = $derived(attempts === 0 ? 0 : Math.round((correctCount / attempts) * 100));
	const parentEquationTex = $derived(buildEquationTex(card.parentId, card.a, card.h, card.k));
	const verticalScaleText = $derived.by(() => {
		const magnitude = Math.abs(card.a);
		const stretchText = magnitude === 1 ? 'no vertical stretch' : `${magnitude}x vertical stretch`;
		const reflectionText = card.a < 0 ? '; reflected across the x-axis' : '';
		return `${stretchText}${reflectionText}`;
	});
	const horizontalShiftText = $derived.by(() => {
		if (card.h === 0) {
			return 'none';
		}
		return card.h > 0 ? `${card.h} right` : `${Math.abs(card.h)} left`;
	});
	const verticalShiftText = $derived.by(() => {
		if (card.k === 0) {
			return 'none';
		}
		return card.k > 0 ? `${card.k} up` : `${Math.abs(card.k)} down`;
	});

	const showAsymptotes = $derived(
		card.parentId === 'reciprocal' || card.parentId === 'reciprocal-squared'
	);
	const showVerticalAsymptote = $derived(showAsymptotes && card.h > X_MIN && card.h < X_MAX);
	const showHorizontalAsymptote = $derived(showAsymptotes && card.k > Y_MIN && card.k < Y_MAX);

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

	const curveSegments = $derived.by(() => {
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
			const y = evaluateTransformed(card, x);

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
	});

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

	function createRandomCard(): FlashCard {
		const parentId = pickRandomValue(parentIds);
		const config = parentConfigs[parentId];
		let a = 1;
		let h = 0;
		let k = 0;

		for (let tries = 0; tries < 20; tries += 1) {
			a = pickRandomValue(config.aValues);
			h = randomInt(config.hRange[0], config.hRange[1]);
			k = randomInt(config.kRange[0], config.kRange[1]);
			if (a !== 1 || h !== 0 || k !== 0) {
				break;
			}
		}

		return {
			parentId,
			a,
			h,
			k,
			optionOrder: answerOptionOrder
		};
	}

	function xShiftTex(h: number) {
		if (h === 0) {
			return 'x';
		}
		return h > 0 ? `x-${h}` : `x+${Math.abs(h)}`;
	}

	function applyScaleTex(a: number, expressionTex: string) {
		if (a === 1) {
			return expressionTex;
		}
		if (a === -1) {
			return `-\\left(${expressionTex}\\right)`;
		}
		return `${a}\\left(${expressionTex}\\right)`;
	}

	function appendVerticalShiftTex(expressionTex: string, k: number) {
		if (k === 0) {
			return `y=${expressionTex}`;
		}
		return `y=${expressionTex}${k > 0 ? `+${k}` : `${k}`}`;
	}

	function buildEquationTex(parentId: ParentId, a: number, h: number, k: number) {
		const shiftedX = xShiftTex(h);
		switch (parentId) {
			case 'quadratic':
				return appendVerticalShiftTex(applyScaleTex(a, `\\left(${shiftedX}\\right)^2`), k);
			case 'cubic':
				return appendVerticalShiftTex(applyScaleTex(a, `\\left(${shiftedX}\\right)^3`), k);
			case 'linear':
				return appendVerticalShiftTex(applyScaleTex(a, shiftedX), k);
			case 'square-root':
				return appendVerticalShiftTex(applyScaleTex(a, `\\sqrt{${shiftedX}}`), k);
			case 'cube-root':
				return appendVerticalShiftTex(applyScaleTex(a, `\\sqrt[3]{${shiftedX}}`), k);
			case 'absolute-value':
				return appendVerticalShiftTex(applyScaleTex(a, `\\left|${shiftedX}\\right|`), k);
			case 'reciprocal':
				return appendVerticalShiftTex(applyScaleTex(a, `\\frac{1}{${shiftedX}}`), k);
			case 'reciprocal-squared':
				return appendVerticalShiftTex(
					applyScaleTex(a, `\\frac{1}{\\left(${shiftedX}\\right)^2}`),
					k
				);
		}
	}

	function evaluateTransformed(currentCard: FlashCard, x: number) {
		const parent = parentById[currentCard.parentId];
		const baseValue = parent.base(x - currentCard.h);
		if (baseValue === null || !Number.isFinite(baseValue)) {
			return null;
		}
		return currentCard.a * baseValue + currentCard.k;
	}

	function toSvgX(x: number) {
		return PAD_LEFT + ((x - X_MIN) / (X_MAX - X_MIN)) * innerWidth;
	}

	function toSvgY(y: number) {
		return PAD_TOP + ((Y_MAX - y) / (Y_MAX - Y_MIN)) * innerHeight;
	}

	function startNextCard() {
		card = createRandomCard();
		selectedParent = null;
		incorrectGuesses = [];
		lastIncorrectGuess = null;
		cardNumber += 1;
	}

	function chooseParent(parentId: ParentId) {
		if (isCorrectGuess || incorrectGuesses.includes(parentId)) {
			return;
		}

		selectedParent = parentId;
		attempts += 1;

		if (parentId === card.parentId) {
			correctCount += 1;
			streak += 1;
			bestStreak = Math.max(bestStreak, streak);
			lastIncorrectGuess = null;
			return;
		}

		streak = 0;
		incorrectGuesses = [...incorrectGuesses, parentId];
		lastIncorrectGuess = parentId;
	}

	function getChoiceButtonClass(parentId: ParentId) {
		const baseClass = 'rounded-xl border px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';
		if (isCorrectGuess && parentId === card.parentId) {
			return `${baseClass} border-emerald-500/60 bg-emerald-100/70 text-emerald-900`;
		}
		if (incorrectGuesses.includes(parentId)) {
			const shakeClass = lastIncorrectGuess === parentId ? ' parent-choice-shake' : '';
			return `${baseClass} border-rose-500/60 bg-rose-100/70 text-rose-900${shakeClass}`;
		}
		if (!isCorrectGuess) {
			return `${baseClass} border-border/70 bg-background/75 hover:border-primary/40 hover:bg-primary/8`;
		}
		return `${baseClass} border-border/70 bg-background/60 text-muted-foreground`;
	}
</script>

<div class="space-y-4">
	<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Card: <span class="font-semibold text-foreground">#{cardNumber}</span>
		</p>
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Correct: <span class="font-semibold text-foreground">{correctCount}/{attempts}</span>
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
			Match the graph to its parent function:
			<MathExpression
				math="y=af(x-h)+k"
				class="ml-1 inline-block whitespace-nowrap align-middle font-semibold text-foreground [&_.katex]:whitespace-nowrap"
			/>
		</p>
	</div>

	<div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
		<svg
			viewBox={`0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`}
			class="h-auto w-full max-w-[30rem] rounded-xl border border-border/70 bg-white lg:max-w-none"
			role="img"
			aria-label="Transformed parent function graph for function identification"
		>
			<rect x={PAD_LEFT} y={PAD_TOP} width={innerWidth} height={innerHeight} fill="white"></rect>

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

			{#if showVerticalAsymptote}
				<line
					x1={toSvgX(card.h)}
					y1={PAD_TOP}
					x2={toSvgX(card.h)}
					y2={PAD_TOP + innerHeight}
					stroke="#f97316"
					stroke-width="1.3"
					stroke-dasharray="5 4"
				/>
			{/if}

			{#if showHorizontalAsymptote}
				<line
					x1={PAD_LEFT}
					y1={toSvgY(card.k)}
					x2={PAD_LEFT + innerWidth}
					y2={toSvgY(card.k)}
					stroke="#f97316"
					stroke-width="1.3"
					stroke-dasharray="5 4"
				/>
			{/if}

			{#each curveSegments as segment (segment)}
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

			<div class="relative lg:h-full lg:min-h-0">
				{#if isCorrectGuess}
					<section class="space-y-3 lg:flex lg:h-full lg:min-h-0 lg:flex-col">
						<div
							class="rounded-xl border border-emerald-500/55 bg-emerald-100/70 px-3 py-3 text-sm text-emerald-900"
						>
						<p class="font-semibold">
							Correct. This card comes from <span class="font-bold">{activeParent.label}</span>.
						</p>
						<p class="mt-1">
							Transformed equation:
							<MathExpression
								math={parentEquationTex}
								class="ml-1 inline-block align-middle font-semibold text-current"
							/>
						</p>
					</div>
					<div class="mt-3 grid gap-2 text-sm text-emerald-900 sm:grid-cols-3">
						<p class="rounded-lg border border-current/20 bg-current/[0.06] px-3 py-2">
							Vertical effect: <span class="font-semibold">{verticalScaleText}</span>
						</p>
						<p class="rounded-lg border border-current/20 bg-current/[0.06] px-3 py-2">
							Horizontal shift: <span class="font-semibold">{horizontalShiftText}</span>
						</p>
						<p class="rounded-lg border border-current/20 bg-current/[0.06] px-3 py-2">
							Vertical shift: <span class="font-semibold">{verticalShiftText}</span>
						</p>
					</div>
						<div class="flex justify-end">
							<button
								type="button"
								class="rounded-lg border border-primary/45 bg-primary/12 px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary/60 hover:bg-primary/20"
								onclick={startNextCard}
							>
								Next card
							</button>
						</div>
				</section>
				{:else}
					<section
						out:slide={{ duration: 220 }}
						class="space-y-3 lg:flex lg:h-full lg:min-h-0 lg:flex-col"
					>
							<div class="space-y-2 lg:flex lg:h-full lg:min-h-0 lg:flex-col">
								<p class="text-sm font-medium text-foreground">Select the parent function:</p>
								<div class="grid gap-2 lg:flex lg:flex-1 lg:min-h-0 lg:flex-col lg:justify-between lg:gap-3">
									{#each card.optionOrder as optionId (optionId)}
										{@const option = parentById[optionId]}
										<button
										type="button"
										class={getChoiceButtonClass(optionId)}
										disabled={isCorrectGuess || incorrectGuesses.includes(optionId)}
										onclick={() => chooseParent(optionId)}
									>
										<p class="text-sm font-semibold">{option.label}</p>
									<MathExpression
										math={option.parentTex}
										class="mt-1 inline-block align-middle text-sm font-medium"
									/>
								</button>
							{/each}
						</div>
					</div>
					</section>
				{/if}
			</div>
		</div>
	</div>

<style>
	.parent-choice-shake {
		animation: parent-choice-shake-keyframes 240ms ease;
	}

	@keyframes parent-choice-shake-keyframes {
		0% {
			transform: translateX(0);
		}
		25% {
			transform: translateX(-3px);
		}
		50% {
			transform: translateX(3px);
		}
		75% {
			transform: translateX(-2px);
		}
		100% {
			transform: translateX(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.parent-choice-shake {
			animation: none;
		}
	}
</style>
