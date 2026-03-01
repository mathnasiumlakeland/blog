<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import MathExpression from '$lib/components/math/math-expression.svelte';

	type Step = 'R' | 'U';
	type GridPoint = { x: number; y: number };
	type Segment = { x1: number; y1: number; x2: number; y2: number };
	type FadingPath = { id: number; points: string; startedAt: number };

	const gridMax = 9;
	const plotSize = 430;
	const plotPad = 40;
	const plotCell = (plotSize - plotPad * 2) / gridMax;
	const ticks = Array.from({ length: gridMax + 1 }, (_, index) => index);
	const autoBuildMs = 5;
	const autoFadeMs = 260;
	const allPathCache = new Map<number, string[]>();

	let squareN = $state(6);
	let generalM = $state(7);
	let generalN = $state(4);

	let placedSteps = $state<Step[]>([]);
	let savedPathPolylines = $state<string[]>([]);
	let autoRunning = $state(false);
	let autoAllPaths = $state<string[]>([]);
	let autoPathIndex = $state(0);
	let autoCurrentPath = $state('');
	let autoVisibleSteps = $state(0);
	let autoFadingPaths = $state<FadingPath[]>([]);
	let autoNow = $state(0);

	let mobileMode = $state(false);
	let dragging = $state(false);
	let dragChoice = $state<Step | null>(null);
	let builderSvg: SVGSVGElement | null = null;
	let autoRaf = 0;
	let autoPathStartAt = 0;

	const squareManhattan = $derived(2 * squareN);
	const squareEuclidean = $derived(Math.sqrt(squareN * squareN + squareN * squareN));
	const squarePathCount = $derived(binomial(2 * squareN, squareN));
	const totalBoardSteps = $derived(squareN * 2);

	const generalPathCount = $derived(binomial(generalM + generalN, generalM));

	const rightsUsed = $derived(placedSteps.filter((step) => step === 'R').length);
	const upsUsed = $derived(placedSteps.length - rightsUsed);
	const currentPoint = $derived({ x: rightsUsed, y: upsUsed });
	const remainingRight = $derived(squareN - rightsUsed);
	const remainingUp = $derived(squareN - upsUsed);
	const canPlaceRight = $derived(remainingRight > 0);
	const canPlaceUp = $derived(remainingUp > 0);
	const isComplete = $derived(remainingRight === 0 && remainingUp === 0);
	const autoTotalPaths = $derived(autoAllPaths.length);
	const autoProgressPercent = $derived(
		autoTotalPaths === 0 ? 0 : Math.min(100, (autoPathIndex / autoTotalPaths) * 100)
	);

	const walkPoints = $derived.by(() => {
		const points: GridPoint[] = [{ x: 0, y: 0 }];
		let x = 0;
		let y = 0;

		for (const step of placedSteps) {
			if (step === 'R' && x < squareN) {
				x += 1;
			}
			if (step === 'U' && y < squareN) {
				y += 1;
			}
			points.push({ x, y });
		}

		return points;
	});

	const pathPolyline = $derived(
		walkPoints
			.map((point) => {
				const svgPoint = toSvg(point);
				return `${svgPoint.x},${svgPoint.y}`;
			})
			.join(' ')
	);

	const targetSvgPoint = $derived(toSvg({ x: squareN, y: squareN }));

	const ghostRightSegment = $derived.by(() => {
		if (!canPlaceRight) {
			return null;
		}
		const start = toSvg(currentPoint);
		const end = toSvg({ x: currentPoint.x + 1, y: currentPoint.y });
		return {
			x1: start.x,
			y1: start.y,
			x2: end.x,
			y2: end.y
		} satisfies Segment;
	});

	const ghostUpSegment = $derived.by(() => {
		if (!canPlaceUp) {
			return null;
		}
		const start = toSvg(currentPoint);
		const end = toSvg({ x: currentPoint.x, y: currentPoint.y + 1 });
		return {
			x1: start.x,
			y1: start.y,
			x2: end.x,
			y2: end.y
		} satisfies Segment;
	});

	const dragPreviewSegment = $derived.by(() => {
		if (!dragChoice) {
			return null;
		}
		if (dragChoice === 'R') {
			return ghostRightSegment;
		}
		return ghostUpSegment;
	});

	const stepSymbols = $derived(placedSteps.map((step) => (step === 'R' ? '→' : '↑')).join(' '));
	const autoCurrentPolyline = $derived(
		autoCurrentPath.length === 0 ? '' : polylineFromStepString(autoCurrentPath, autoVisibleSteps)
	);
	const autoVisibleSymbols = $derived(
		autoCurrentPath
			.slice(0, autoVisibleSteps)
			.split('')
			.map((step) => (step === 'R' ? '→' : '↑'))
			.join(' ')
	);

	function binomial(total: number, chosen: number): bigint {
		if (chosen < 0 || chosen > total) {
			return 0n;
		}

		const k = Math.min(chosen, total - chosen);
		let value = 1n;

		for (let i = 1; i <= k; i += 1) {
			value = (value * BigInt(total - k + i)) / BigInt(i);
		}

		return value;
	}

	function formatBigInt(value: bigint): string {
		return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	}

	function toSvg(point: GridPoint): GridPoint {
		return {
			x: plotPad + point.x * plotCell,
			y: plotSize - plotPad - point.y * plotCell
		};
	}

	function polylineFromStepString(steps: string, visibleSteps = steps.length): string {
		let x = 0;
		let y = 0;
		const maxSteps = Math.min(visibleSteps, steps.length);
		const points = [toSvg({ x: 0, y: 0 })];

		for (let index = 0; index < maxSteps; index += 1) {
			if (steps[index] === 'R') {
				x += 1;
			} else {
				y += 1;
			}
			points.push(toSvg({ x, y }));
		}

		return points.map((point) => `${point.x},${point.y}`).join(' ');
	}

	function getAllStepStringsForN(n: number): string[] {
		const cached = allPathCache.get(n);
		if (cached) {
			return cached;
		}

		const results: string[] = [];
		const steps: string[] = [];

		const build = (rights: number, ups: number) => {
			if (rights === n && ups === n) {
				results.push(steps.join(''));
				return;
			}

			if (rights < n) {
				steps.push('R');
				build(rights + 1, ups);
				steps.pop();
			}

			if (ups < n) {
				steps.push('U');
				build(rights, ups + 1);
				steps.pop();
			}
		};

		build(0, 0);
		allPathCache.set(n, results);
		return results;
	}

	function placeStep(step: Step) {
		if (autoRunning) {
			return;
		}

		if (step === 'R' && canPlaceRight) {
			placedSteps = [...placedSteps, 'R'];
			return;
		}

		if (step === 'U' && canPlaceUp) {
			placedSteps = [...placedSteps, 'U'];
		}
	}

	function handleGhostKey(event: KeyboardEvent, step: Step) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			placeStep(step);
		}
	}

	function undoStep() {
		if (autoRunning) {
			return;
		}

		if (placedSteps.length === 0) {
			return;
		}

		placedSteps = placedSteps.slice(0, -1);
	}

	function resetBuilder() {
		placedSteps = [];
		dragging = false;
		dragChoice = null;
	}

	function stopAutoShow() {
		autoRunning = false;
		autoAllPaths = [];
		autoPathIndex = 0;
		autoCurrentPath = '';
		autoVisibleSteps = 0;
		autoFadingPaths = [];
		autoNow = 0;
		if (autoRaf) {
			cancelAnimationFrame(autoRaf);
			autoRaf = 0;
		}
	}

	function resetAllPaths() {
		stopAutoShow();
		resetBuilder();
		savedPathPolylines = [];
	}

	function addAnotherPath() {
		if (!isComplete) {
			return;
		}

		savedPathPolylines = [...savedPathPolylines, pathPolyline];
		resetBuilder();
	}

	function tickAutoShow(now: number) {
		if (!autoRunning) {
			return;
		}

		autoNow = now;
		let fades = autoFadingPaths.filter((path) => now - path.startedAt < autoFadeMs);

		if (autoCurrentPath.length === 0 && autoPathIndex < autoAllPaths.length) {
			autoCurrentPath = autoAllPaths[autoPathIndex];
			autoPathStartAt = now;
		}

		while (autoCurrentPath.length > 0 && now - autoPathStartAt >= autoBuildMs) {
			fades = [
				...fades,
				{
					id: autoPathIndex,
					points: polylineFromStepString(autoCurrentPath),
					startedAt: autoPathStartAt + autoBuildMs
				}
			];

			autoPathIndex += 1;
			if (autoPathIndex >= autoAllPaths.length) {
				autoCurrentPath = '';
				autoVisibleSteps = 0;
				break;
			}

			autoCurrentPath = autoAllPaths[autoPathIndex];
			autoPathStartAt += autoBuildMs;
		}

		if (autoCurrentPath.length > 0) {
			const elapsed = Math.max(0, now - autoPathStartAt);
			const ratio = Math.min(1, elapsed / autoBuildMs);
			autoVisibleSteps = Math.max(1, Math.ceil(ratio * autoCurrentPath.length));
		}

		autoFadingPaths = fades;

		const done = autoPathIndex >= autoAllPaths.length && autoCurrentPath.length === 0;
		if (done && autoFadingPaths.length === 0) {
			stopAutoShow();
			return;
		}

		autoRaf = requestAnimationFrame(tickAutoShow);
	}

	function startAutoShow() {
		resetAllPaths();
		const paths = getAllStepStringsForN(squareN);
		if (paths.length === 0) {
			return;
		}

		autoAllPaths = paths;
		autoRunning = true;
		autoPathIndex = 0;
		autoCurrentPath = paths[0];
		autoVisibleSteps = 0;
		autoFadingPaths = [];
		autoNow = performance.now();
		autoPathStartAt = autoNow;
		autoRaf = requestAnimationFrame(tickAutoShow);
	}

	function toggleAutoShow() {
		if (autoRunning) {
			stopAutoShow();
			return;
		}

		startAutoShow();
	}

	function pointerToSvg(event: PointerEvent): GridPoint | null {
		if (!builderSvg) {
			return null;
		}

		const rect = builderSvg.getBoundingClientRect();
		if (rect.width === 0 || rect.height === 0) {
			return null;
		}

		return {
			x: ((event.clientX - rect.left) / rect.width) * plotSize,
			y: ((event.clientY - rect.top) / rect.height) * plotSize
		};
	}

	function updateDragChoice(event: PointerEvent) {
		if (!dragging) {
			return;
		}

		const cursor = pointerToSvg(event);
		if (!cursor) {
			return;
		}

		const anchor = toSvg(currentPoint);
		const dx = cursor.x - anchor.x;
		const dy = cursor.y - anchor.y;
		const threshold = plotCell * 0.34;
		let choice: Step | null = null;

		if (Math.abs(dx) >= Math.abs(dy)) {
			if (dx > threshold && canPlaceRight) {
				choice = 'R';
			}
		} else if (dy < -threshold && canPlaceUp) {
			choice = 'U';
		}

		dragChoice = choice;
	}

	function startDrag(event: PointerEvent) {
		if (mobileMode || isComplete || autoRunning || event.pointerType === 'touch') {
			return;
		}

		const cursor = pointerToSvg(event);
		if (!cursor) {
			return;
		}

		const anchor = toSvg(currentPoint);
		const nearAnchor = Math.hypot(cursor.x - anchor.x, cursor.y - anchor.y) <= plotCell * 0.9;
		if (!nearAnchor) {
			return;
		}

		dragging = true;
		dragChoice = null;
		builderSvg?.setPointerCapture(event.pointerId);
		updateDragChoice(event);
	}

	function stopDrag(event: PointerEvent) {
		if (!dragging) {
			return;
		}

		updateDragChoice(event);
		if (dragChoice) {
			placeStep(dragChoice);
		}

		dragging = false;
		dragChoice = null;
		if (builderSvg?.hasPointerCapture(event.pointerId)) {
			builderSvg.releasePointerCapture(event.pointerId);
		}
	}

	function cancelDrag(event: PointerEvent) {
		if (!dragging) {
			return;
		}

		dragging = false;
		dragChoice = null;
		if (builderSvg?.hasPointerCapture(event.pointerId)) {
			builderSvg.releasePointerCapture(event.pointerId);
		}
	}

	onMount(() => {
		const mediaQuery = window.matchMedia('(max-width: 767px), (pointer: coarse)');
		const syncMode = () => {
			mobileMode = mediaQuery.matches;
		};

		syncMode();
		mediaQuery.addEventListener('change', syncMode);

		return () => {
			stopAutoShow();
			mediaQuery.removeEventListener('change', syncMode);
		};
	});

	$effect(() => {
		squareN;
		resetAllPaths();
	});
</script>

<div class="space-y-8">
	<section class="space-y-4 rounded-2xl border border-border/70 bg-card/75 p-4 sm:p-5">
		<div class="space-y-2">
			<h3 class="text-lg font-semibold sm:text-xl">Square Target: From <code>(0,0)</code> to <code>(n,n)</code></h3>
			<p class="text-sm text-muted-foreground">
				Each valid route has exactly <code>n</code> right moves and <code>n</code> up moves, so every path has
				Manhattan length <code>2n</code>.
			</p>
		</div>

		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			<p class="rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
				<MathExpression
					math={`d_\\text{Manhattan}=n+n=2n=${squareManhattan}`}
					class="font-semibold text-foreground"
				/>
			</p>
			<p class="rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
				<MathExpression
					math={`d_\\text{Euclidean}=\\sqrt{n^2+n^2}=n\\sqrt{2}\\approx${squareEuclidean.toFixed(2)}`}
					class="font-semibold text-foreground"
				/>
			</p>
			<p class="rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
				<MathExpression math={`\\binom{2n}{n}=\\binom{${2 * squareN}}{${squareN}}`} class="font-semibold text-foreground" />
				<span class="mt-1 block text-foreground">Paths: {formatBigInt(squarePathCount)}</span>
			</p>
		</div>

		<label class="space-y-1 text-xs font-medium text-muted-foreground sm:max-w-sm">
			Choose n: {squareN}
			<input
				type="range"
					min="2"
					max="9"
				step="1"
				bind:value={squareN}
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
			/>
		</label>

		<p class="text-xs text-muted-foreground">
			Taxi-cab view: you travel on grid streets, so you count blocks. Euclidean view: you measure the straight-line
			diagonal.
		</p>
	</section>

	<section class="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
		<div class="space-y-3 rounded-2xl border border-border/70 bg-card/75 p-4 sm:p-5">
			<div class="space-y-1">
				<h3 class="text-lg font-semibold sm:text-xl">Build a Path for <code>({squareN},{squareN})</code></h3>
			</div>

				<svg
					bind:this={builderSvg}
					viewBox={`0 0 ${plotSize} ${plotSize}`}
					class="path-grid h-auto w-full rounded-xl border border-border/70 bg-background/85"
					role="img"
					aria-label={`Interactive lattice path builder from the origin to ${squareN} comma ${squareN}`}
					onpointerdown={startDrag}
					onpointermove={updateDragChoice}
				onpointerup={stopDrag}
				onpointercancel={cancelDrag}
			>
				<rect x="0" y="0" width={plotSize} height={plotSize} fill="rgba(248,250,252,0.6)"></rect>

				{#each ticks as tick (tick)}
					<line
						x1={plotPad + tick * plotCell}
						y1={plotPad}
						x2={plotPad + tick * plotCell}
						y2={plotSize - plotPad}
						stroke="rgba(148,163,184,0.45)"
						stroke-width="1"
					></line>
					<line
						x1={plotPad}
						y1={plotPad + tick * plotCell}
						x2={plotSize - plotPad}
						y2={plotPad + tick * plotCell}
						stroke="rgba(148,163,184,0.45)"
						stroke-width="1"
					></line>

					<text
						x={plotPad + tick * plotCell}
						y={plotSize - plotPad + 18}
						text-anchor="middle"
						font-size="11"
						fill="rgba(71,85,105,0.9)"
					>
						{tick}
					</text>
					<text
						x={plotPad - 15}
						y={plotSize - plotPad - tick * plotCell + 4}
						text-anchor="middle"
						font-size="11"
						fill="rgba(71,85,105,0.9)"
					>
						{tick}
					</text>
				{/each}

					<circle cx={plotPad} cy={plotSize - plotPad} r="4" fill="rgba(37,99,235,0.9)"></circle>
					<circle cx={targetSvgPoint.x} cy={targetSvgPoint.y} r="4" fill="rgba(5,150,105,0.95)"></circle>

					{#if autoRunning || autoFadingPaths.length > 0}
						{#each autoFadingPaths as fadingPath (fadingPath.id)}
							{@const age = autoNow - fadingPath.startedAt}
							{@const opacity = Math.max(0, 1 - age / autoFadeMs)}
							<polyline
								points={fadingPath.points}
								fill="none"
								stroke="rgba(100,116,139,0.58)"
								stroke-width="4"
								stroke-linecap="round"
								stroke-linejoin="round"
								opacity={opacity}
							></polyline>
						{/each}

						{#if autoCurrentPolyline}
							<polyline
								points={autoCurrentPolyline}
								fill="none"
								stroke="rgba(14,116,144,0.96)"
								stroke-width="5"
								stroke-linecap="round"
								stroke-linejoin="round"
							></polyline>
						{/if}
					{:else}
						{#each savedPathPolylines as savedPath, index (index)}
							<polyline
								points={savedPath}
								fill="none"
								stroke="rgba(100,116,139,0.44)"
								stroke-width="4"
								stroke-linecap="round"
								stroke-linejoin="round"
							></polyline>
						{/each}

						<polyline
							points={pathPolyline}
							fill="none"
							stroke="rgba(14,116,144,0.94)"
							stroke-width="5"
							stroke-linecap="round"
							stroke-linejoin="round"
						></polyline>

						{#if ghostRightSegment}
							<line
								x1={ghostRightSegment.x1}
								y1={ghostRightSegment.y1}
								x2={ghostRightSegment.x2}
								y2={ghostRightSegment.y2}
								class="ghost-choice ghost-right"
								stroke="rgba(59,130,246,0.36)"
								stroke-width="6"
								stroke-dasharray="6 6"
								stroke-linecap="round"
							></line>
							{#if mobileMode}
								<line
									x1={ghostRightSegment.x1}
									y1={ghostRightSegment.y1}
									x2={ghostRightSegment.x2}
									y2={ghostRightSegment.y2}
									stroke="transparent"
									stroke-width="26"
									stroke-linecap="round"
									tabindex="0"
									role="button"
									aria-label="Add one right move"
									onclick={() => placeStep('R')}
									onkeydown={(event) => handleGhostKey(event, 'R')}
								></line>
							{/if}
						{/if}

						{#if ghostUpSegment}
							<line
								x1={ghostUpSegment.x1}
								y1={ghostUpSegment.y1}
								x2={ghostUpSegment.x2}
								y2={ghostUpSegment.y2}
								class="ghost-choice ghost-up"
								stroke="rgba(16,185,129,0.36)"
								stroke-width="6"
								stroke-dasharray="6 6"
								stroke-linecap="round"
							></line>
							{#if mobileMode}
								<line
									x1={ghostUpSegment.x1}
									y1={ghostUpSegment.y1}
									x2={ghostUpSegment.x2}
									y2={ghostUpSegment.y2}
									stroke="transparent"
									stroke-width="26"
									stroke-linecap="round"
									tabindex="0"
									role="button"
									aria-label="Add one up move"
									onclick={() => placeStep('U')}
									onkeydown={(event) => handleGhostKey(event, 'U')}
								></line>
							{/if}
						{/if}

						{#if dragPreviewSegment}
							<line
								x1={dragPreviewSegment.x1}
								y1={dragPreviewSegment.y1}
								x2={dragPreviewSegment.x2}
								y2={dragPreviewSegment.y2}
								stroke="rgba(245,158,11,0.95)"
								stroke-width="7"
								stroke-linecap="round"
							></line>
						{/if}

						{#each walkPoints as point, index (index)}
							{@const plotted = toSvg(point)}
							<circle
								cx={plotted.x}
								cy={plotted.y}
								r={index === walkPoints.length - 1 ? 6.5 : 3.2}
								fill={index === walkPoints.length - 1 ? 'rgba(249,115,22,0.96)' : 'rgba(15,23,42,0.76)'}
							></circle>
						{/each}
					{/if}
				</svg>

				<p class="text-xs text-muted-foreground">
					{#if autoRunning}
						Showing every path in order. Finished paths fade out quickly while new paths are built.
					{:else if mobileMode}
						Mobile mode: tap a faded segment at the current point to place the next move.
					{:else}
						Desktop mode: drag from the orange point right or up to place the next move.
					{/if}
				</p>
		</div>

			<div class="space-y-3 rounded-2xl border border-border/70 bg-card/75 p-4 sm:p-5">
				<h4 class="text-base font-semibold">Move Ledger (for <code>({squareN},{squareN})</code>)</h4>

				<div class="grid grid-cols-2 gap-2 text-sm">
					<p class="rounded-lg border border-border/70 bg-background/80 px-3 py-2 text-muted-foreground">
						Right left:
						<span class="font-semibold text-foreground">{remainingRight}</span>
					</p>
					<p class="rounded-lg border border-border/70 bg-background/80 px-3 py-2 text-muted-foreground">
						Up left:
						<span class="font-semibold text-foreground">{remainingUp}</span>
					</p>
					<p class="rounded-lg border border-border/70 bg-background/80 px-3 py-2 text-muted-foreground">
						Placed:
						<span class="font-semibold text-foreground">{placedSteps.length}/{totalBoardSteps}</span>
					</p>
					<p class="rounded-lg border border-border/70 bg-background/80 px-3 py-2 text-muted-foreground">
						Current point:
						<span class="font-semibold text-foreground">({currentPoint.x},{currentPoint.y})</span>
					</p>
					{#if autoRunning}
						<p class="col-span-2 rounded-lg border border-border/70 bg-background/80 px-3 py-2 text-muted-foreground">
							Live counter:
							<span class="font-semibold text-foreground">{Math.min(autoPathIndex, autoTotalPaths)} / {autoTotalPaths}</span>
							<span class="ml-2 text-foreground/80">({autoProgressPercent.toFixed(1)}%)</span>
						</p>
					{/if}
				</div>

				{#if autoTotalPaths > 0}
					<div class="h-2 overflow-hidden rounded-full bg-primary/18">
						<div
							class="h-full bg-primary transition-[width] duration-75 ease-linear"
							style={`width:${autoProgressPercent.toFixed(2)}%`}
						></div>
					</div>
				{/if}

				<div class="space-y-1 rounded-lg border border-border/70 bg-background/75 p-3">
					<p class="text-xs font-medium text-muted-foreground">Sequence</p>
					{#if autoRunning}
						{#if autoVisibleSymbols.length === 0}
							<p class="truncate text-sm text-muted-foreground">Auto mode preparing next path...</p>
						{:else}
							<p class="truncate font-mono text-sm text-foreground">{autoVisibleSymbols}</p>
						{/if}
					{:else if placedSteps.length === 0}
						<p class="truncate text-sm text-muted-foreground">No moves yet.</p>
					{:else}
						<p class="truncate font-mono text-sm text-foreground">{stepSymbols}</p>
					{/if}
				</div>

				<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
					<MathExpression
						math={`\\binom{2n}{n}=\\binom{${2 * squareN}}{${squareN}}`}
						class="font-semibold text-foreground"
					/>
					There are {formatBigInt(squarePathCount)} valid step strings with {squareN}
					<code>R</code>'s and {squareN} <code>U</code>'s.
				</p>

				<Button variant={autoRunning ? 'secondary' : 'outline'} class="w-full" onclick={toggleAutoShow}>
					{autoRunning ? 'Stop showing all paths' : 'Show me all paths'}
				</Button>

				<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
					<Button variant="outline" class="w-full" onclick={undoStep} disabled={autoRunning || placedSteps.length === 0}>
						Undo last move
					</Button>
					<Button
						variant="secondary"
						class="w-full"
						onclick={resetBuilder}
						disabled={autoRunning || placedSteps.length === 0}
					>
						Reset path
					</Button>
				</div>

				{#if isComplete && !autoRunning}
					<Button class="w-full" onclick={addAnotherPath}>
						Add another path
					</Button>
				{/if}

				{#if isComplete && !autoRunning}
					<p class="rounded-lg border border-emerald-300/60 bg-emerald-50/75 px-3 py-2 text-sm text-emerald-900">
						Complete. You used all {squareN} right moves and all {squareN} up moves to reach
						<code>({squareN},{squareN})</code>.
					</p>
				{/if}
			</div>
	</section>

	<section class="space-y-4 rounded-2xl border border-border/70 bg-card/75 p-4 sm:p-5">
		<div class="space-y-2">
			<h3 class="text-lg font-semibold sm:text-xl">General Case: From <code>(0,0)</code> to <code>(m,n)</code></h3>
			<p class="text-sm text-muted-foreground">
				Now you need <code>m</code> rights and <code>n</code> ups, so you count arrangements of two move types in
				<code>m+n</code> slots.
			</p>
		</div>

		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			<p class="rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
				<MathExpression math={`d_\\text{Manhattan}=m+n=${generalM + generalN}`} class="font-semibold text-foreground" />
			</p>
			<p class="rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
				<MathExpression math={`\\binom{m+n}{m}=\\frac{(m+n)!}{m!\\,n!}`} class="font-semibold text-foreground" />
			</p>
			<p class="rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
				<MathExpression math={`\\binom{${generalM + generalN}}{${generalM}}`} class="font-semibold text-foreground" />
				<span class="mt-1 block text-foreground">Paths: {formatBigInt(generalPathCount)}</span>
			</p>
		</div>

		<div class="grid gap-3 sm:grid-cols-2">
			<label class="space-y-1 text-xs font-medium text-muted-foreground">
				Choose m: {generalM}
				<input
					type="range"
					min="0"
					max="16"
					step="1"
					bind:value={generalM}
					class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
				/>
			</label>
			<label class="space-y-1 text-xs font-medium text-muted-foreground">
				Choose n: {generalN}
				<input
					type="range"
					min="0"
					max="16"
					step="1"
					bind:value={generalN}
					class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
				/>
			</label>
		</div>
	</section>
</div>

<style>
	.ghost-choice {
		transition: stroke 120ms ease, stroke-width 120ms ease;
	}

	.ghost-right:hover {
		stroke: rgba(37, 99, 235, 0.62);
		stroke-width: 7;
	}

	.ghost-up:hover {
		stroke: rgba(5, 150, 105, 0.62);
		stroke-width: 7;
	}

	.path-grid {
		user-select: none;
		-webkit-user-select: none;
	}

	.path-grid text {
		pointer-events: none;
	}
</style>
