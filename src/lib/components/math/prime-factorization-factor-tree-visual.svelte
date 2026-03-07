<script module lang="ts">
	import type { MathToolMeta } from './tool-meta';
	import { requireInteractiveToolMetaById } from './tool-registry';

	export const toolMeta: MathToolMeta = requireInteractiveToolMetaById(
		'prime-factorization-factor-tree'
	);
</script>

<script lang="ts">
	import MathExpression from '$lib/components/math/math-expression.svelte';
	import {
		TOOL_BG_GRADIENT_END,
		TOOL_BG_GRADIENT_START,
		TOOL_BG_SURFACE_WASH
	} from './tool-visual-theme';

	type Mode = 'example' | 'practice';

	type FactorTreeNode = {
		value: number;
		left?: FactorTreeNode;
		right?: FactorTreeNode;
	};

	type PracticeNode = {
		id: string;
		value: number;
		expanded: boolean;
		left?: PracticeNode;
		right?: PracticeNode;
	};

	type DisplayNode = {
		id: string;
		value: number | null;
		isPrime: boolean;
		isPlaceholder: boolean;
		side: 'left' | 'right' | null;
		isActive: boolean;
		left?: DisplayNode;
		right?: DisplayNode;
	};

	type PositionedNode = {
		id: string;
		x: number;
		y: number;
		value: number | null;
		isPrime: boolean;
		isPlaceholder: boolean;
		side: 'left' | 'right' | null;
		isActive: boolean;
	};

	type TreeEdge = {
		id: string;
		x1: number;
		y1: number;
		x2: number;
		y2: number;
	};

	type TreeLayout = {
		width: number;
		height: number;
		nodes: PositionedNode[];
		edges: TreeEdge[];
	};

	type PracticeFeedback = {
		kind: 'ok' | 'error' | 'info';
		message: string;
	};

	const MAX_NUMBER = 1000;
	const NODE_RADIUS = 24;
	const practiceSeeds = [24, 36, 48, 54, 60, 72, 84, 90, 96, 108, 120, 144, 180, 210, 240, 300];

	let mode = $state<Mode>('example');

	let exploreInput = $state('72');
	let appliedExploreNumber = $state(72);

	let practiceNodeCounter = 0;
	const initialPracticeTree = createPracticeRoot(pickPracticeSeed());
	let practiceTree = $state(initialPracticeTree);
	let practiceInput = $state(initialPracticeTree.value.toString());
	let activePracticeNodeId = $state(getNextExpandableNodeId(initialPracticeTree));
	let leftFactorInput = $state('');
	let rightFactorInput = $state('');
	let practiceFeedback = $state<PracticeFeedback | null>(null);

	function parseWholeNumber(value: string | number): number | null {
		if (typeof value === 'number') {
			if (!Number.isFinite(value) || !Number.isInteger(value)) {
				return null;
			}
			return value;
		}

		const trimmed = value.trim();
		if (!trimmed) {
			return null;
		}

		const parsed = Number(trimmed);
		if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
			return null;
		}

		return parsed;
	}

	function validateRadicand(value: number | null) {
		if (value === null) {
			return 'Enter a whole number to start.';
		}
		if (value < 2) {
			return 'Use a whole number greater than or equal to 2.';
		}
		if (value > MAX_NUMBER) {
			return `Use ${MAX_NUMBER} or smaller so the tree stays readable.`;
		}
		return null;
	}

	function validatePracticeNumber(value: number | null) {
		const baseMessage = validateRadicand(value);
		if (baseMessage) {
			return baseMessage;
		}
		if (value !== null && isPrime(value)) {
			return 'Choose a composite number so there is a factor tree to complete.';
		}
		return null;
	}

	function isPrime(value: number): boolean {
		if (value < 2) {
			return false;
		}
		if (value === 2) {
			return true;
		}
		if (value % 2 === 0) {
			return false;
		}

		const limit = Math.floor(Math.sqrt(value));
		for (let divisor = 3; divisor <= limit; divisor += 2) {
			if (value % divisor === 0) {
				return false;
			}
		}

		return true;
	}

	function chooseFactorPair(value: number): [number, number] {
		const start = Math.floor(Math.sqrt(value));
		for (let factor = start; factor >= 2; factor -= 1) {
			if (value % factor === 0) {
				return [factor, value / factor];
			}
		}

		return [1, value];
	}

	function buildExploreTree(value: number): FactorTreeNode {
		if (isPrime(value)) {
			return { value };
		}

		const [leftValue, rightValue] = chooseFactorPair(value);
		return {
			value,
			left: buildExploreTree(leftValue),
			right: buildExploreTree(rightValue)
		};
	}

	function nextPracticeNodeId() {
		practiceNodeCounter += 1;
		return `pf-${practiceNodeCounter}`;
	}

	function pickPracticeSeed() {
		return practiceSeeds[Math.floor(Math.random() * practiceSeeds.length)] ?? 72;
	}

	function createPracticeRoot(value: number): PracticeNode {
		practiceNodeCounter = 0;
		return {
			id: nextPracticeNodeId(),
			value,
			expanded: false
		};
	}

	function findPracticeNodeById(node: PracticeNode, id: string): PracticeNode | null {
		if (node.id === id) {
			return node;
		}
		if (node.left) {
			const leftResult = findPracticeNodeById(node.left, id);
			if (leftResult) {
				return leftResult;
			}
		}
		if (node.right) {
			const rightResult = findPracticeNodeById(node.right, id);
			if (rightResult) {
				return rightResult;
			}
		}
		return null;
	}

	function getNextExpandableNodeId(node: PracticeNode): string | null {
		if (!isPrime(node.value) && !node.expanded) {
			return node.id;
		}

		if (node.left) {
			const leftResult = getNextExpandableNodeId(node.left);
			if (leftResult) {
				return leftResult;
			}
		}

		if (node.right) {
			const rightResult = getNextExpandableNodeId(node.right);
			if (rightResult) {
				return rightResult;
			}
		}

		return null;
	}

	function expandPracticeNode(
		node: PracticeNode,
		id: string,
		leftValue: number,
		rightValue: number
	): PracticeNode {
		if (node.id === id) {
			return {
				...node,
				expanded: true,
				left: {
					id: nextPracticeNodeId(),
					value: leftValue,
					expanded: false
				},
				right: {
					id: nextPracticeNodeId(),
					value: rightValue,
					expanded: false
				}
			};
		}

		return {
			...node,
			left: node.left ? expandPracticeNode(node.left, id, leftValue, rightValue) : undefined,
			right: node.right ? expandPracticeNode(node.right, id, leftValue, rightValue) : undefined
		};
	}

	function toDisplayExploreTree(node: FactorTreeNode, path = 'explore-root'): DisplayNode {
		return {
			id: path,
			value: node.value,
			isPrime: isPrime(node.value),
			isPlaceholder: false,
			side: null,
			isActive: false,
			left: node.left ? toDisplayExploreTree(node.left, `${path}-left`) : undefined,
			right: node.right ? toDisplayExploreTree(node.right, `${path}-right`) : undefined
		};
	}

	function toDisplayPracticeTree(node: PracticeNode, activeNodeId: string | null): DisplayNode {
		const displayNode: DisplayNode = {
			id: node.id,
			value: node.value,
			isPrime: isPrime(node.value),
			isPlaceholder: false,
			side: null,
			isActive: node.id === activeNodeId
		};

		if (node.expanded && node.left && node.right) {
			displayNode.left = toDisplayPracticeTree(node.left, activeNodeId);
			displayNode.right = toDisplayPracticeTree(node.right, activeNodeId);
			return displayNode;
		}

		if (!node.expanded && node.id === activeNodeId && !isPrime(node.value)) {
			displayNode.left = {
				id: `${node.id}-left-placeholder`,
				value: null,
				isPrime: false,
				isPlaceholder: true,
				side: 'left',
				isActive: false
			};
			displayNode.right = {
				id: `${node.id}-right-placeholder`,
				value: null,
				isPrime: false,
				isPlaceholder: true,
				side: 'right',
				isActive: false
			};
		}

		return displayNode;
	}

	function countLeaves(node: DisplayNode): number {
		const children = [node.left, node.right].filter(
			(child): child is DisplayNode => child !== undefined
		);
		if (children.length === 0) {
			return 1;
		}
		return children.reduce((sum, child) => sum + countLeaves(child), 0);
	}

	function maxDepth(node: DisplayNode): number {
		const children = [node.left, node.right].filter(
			(child): child is DisplayNode => child !== undefined
		);
		if (children.length === 0) {
			return 0;
		}
		return 1 + Math.max(...children.map((child) => maxDepth(child)));
	}

	function buildDisplayLayout(root: DisplayNode): TreeLayout {
		const width = 760;
		const paddingX = 56;
		const paddingTop = 56;
		const verticalGap = 86;
		const leafCount = countLeaves(root);
		const depth = maxDepth(root);
		const usableWidth = width - paddingX * 2;
		const horizontalGap = leafCount === 1 ? 0 : usableWidth / (leafCount - 1);
		const height = paddingTop * 2 + depth * verticalGap;

		const nodes: PositionedNode[] = [];
		const edges: TreeEdge[] = [];
		let leafCursor = 0;

		function traverse(node: DisplayNode, level: number, path: string): { x: number; y: number } {
			const y = paddingTop + level * verticalGap;
			const children = [node.left, node.right].filter(
				(child): child is DisplayNode => child !== undefined
			);

			let x = width / 2;
			if (children.length === 0) {
				x = leafCount === 1 ? width / 2 : paddingX + leafCursor * horizontalGap;
				leafCursor += 1;
			} else {
				const childPositions = children.map((child, index) =>
					traverse(child, level + 1, `${path}-${index}`)
				);
				x = childPositions.reduce((sum, position) => sum + position.x, 0) / childPositions.length;

				for (const childPosition of childPositions) {
					edges.push({
						id: `${path}-to-${childPosition.x}-${childPosition.y}`,
						x1: x,
						y1: y,
						x2: childPosition.x,
						y2: childPosition.y
					});
				}
			}

			nodes.push({
				id: path,
				x,
				y,
				value: node.value,
				isPrime: node.isPrime,
				isPlaceholder: node.isPlaceholder,
				side: node.side,
				isActive: node.isActive
			});

			return { x, y };
		}

		traverse(root, 0, root.id);
		return { width, height, nodes, edges };
	}

	function collectPrimeLeaves(node: PracticeNode, factors: number[]) {
		const children = [node.left, node.right].filter(
			(child): child is PracticeNode => child !== undefined
		);

		if (children.length === 0) {
			if (isPrime(node.value)) {
				factors.push(node.value);
			}
			return;
		}

		for (const child of children) {
			collectPrimeLeaves(child, factors);
		}
	}

	function factorize(value: number): number[] {
		const factors: number[] = [];
		let remaining = value;
		let divisor = 2;

		while (remaining > 1 && divisor * divisor <= remaining) {
			while (remaining % divisor === 0) {
				factors.push(divisor);
				remaining /= divisor;
			}
			divisor = divisor === 2 ? 3 : divisor + 2;
		}

		if (remaining > 1) {
			factors.push(remaining);
		}

		return factors;
	}

	function joinProductTeX(values: number[]) {
		if (values.length === 0) {
			return '1';
		}
		return values.join('\\cdot');
	}

	function toCondensedPrimeProductTeX(values: number[]) {
		if (values.length === 0) {
			return '1';
		}

		const sorted = [...values].sort((left, right) => left - right);
		const terms: string[] = [];
		let index = 0;

		while (index < sorted.length) {
			const current = sorted[index];
			let count = 1;
			let nextIndex = index + 1;

			while (nextIndex < sorted.length && sorted[nextIndex] === current) {
				count += 1;
				nextIndex += 1;
			}

			terms.push(count === 1 ? `${current}` : `${current}^{${count}}`);
			index = nextIndex;
		}

		return terms.join('\\cdot');
	}

	function combineProductAndCondensed(base: number, factors: number[]) {
		const product = joinProductTeX(factors);
		const condensed = toCondensedPrimeProductTeX(factors);

		return condensed === product ? `${base}=${product}` : `${base}=${product}=${condensed}`;
	}

	function setMode(nextMode: Mode) {
		mode = nextMode;
		practiceFeedback = null;
	}

	function applyExploreNumber() {
		if (!canApplyExplore || parsedExploreInput === null) {
			return;
		}
		appliedExploreNumber = parsedExploreInput;
	}

	function submitExploreNumber(event: SubmitEvent) {
		event.preventDefault();
		applyExploreNumber();
	}

	function startNewPractice(value = pickPracticeSeed()) {
		practiceInput = value.toString();
		practiceTree = createPracticeRoot(value);
		activePracticeNodeId = getNextExpandableNodeId(practiceTree);
		leftFactorInput = '';
		rightFactorInput = '';
		practiceFeedback = null;
	}

	function applyPracticeNumber() {
		if (!canApplyPractice || parsedPracticeInput === null) {
			return;
		}
		startNewPractice(parsedPracticeInput);
	}

	function submitPracticeNumber(event: SubmitEvent) {
		event.preventDefault();
		applyPracticeNumber();
	}

	function checkPracticeFactors() {
		if (!activePracticeNodeId) {
			return;
		}

		const activeNode = findPracticeNodeById(practiceTree, activePracticeNodeId);
		if (!activeNode) {
			return;
		}

		const leftValue = parseWholeNumber(leftFactorInput);
		const rightValue = parseWholeNumber(rightFactorInput);
		if (
			leftValue === null ||
			rightValue === null ||
			leftValue < 2 ||
			rightValue < 2
		) {
			practiceFeedback = {
				kind: 'error',
				message: 'Enter two whole-number factors greater than 1.'
			};
			return;
		}

		if (leftValue * rightValue !== activeNode.value) {
			practiceFeedback = {
				kind: 'error',
				message: `Not quite. ${leftValue} × ${rightValue} is not ${activeNode.value}. Try again.`
			};
			return;
		}

		practiceTree = expandPracticeNode(practiceTree, activePracticeNodeId, leftValue, rightValue);
		activePracticeNodeId = getNextExpandableNodeId(practiceTree);
		leftFactorInput = '';
		rightFactorInput = '';

		if (activePracticeNodeId === null) {
			practiceFeedback = null;
			return;
		}

		practiceFeedback = null;
	}

	function submitPracticeFactorsWithEnter(event: KeyboardEvent) {
		if (event.key !== 'Enter') {
			return;
		}
		event.preventDefault();
		checkPracticeFactors();
	}

	const parsedExploreInput = $derived.by(() => parseWholeNumber(exploreInput));
	const hasTypedExploreInput = $derived.by(() => exploreInput.trim().length > 0);
	const exploreValidationMessage = $derived.by(() => {
		if (!hasTypedExploreInput) {
			return null;
		}
		return validateRadicand(parsedExploreInput);
	});
	const canApplyExplore = $derived.by(() => {
		return parsedExploreInput !== null && validateRadicand(parsedExploreInput) === null;
	});
	const parsedPracticeInput = $derived.by(() => parseWholeNumber(practiceInput));
	const hasTypedPracticeInput = $derived.by(() => practiceInput.trim().length > 0);
	const practiceValidationMessage = $derived.by(() => {
		if (!hasTypedPracticeInput) {
			return null;
		}
		return validatePracticeNumber(parsedPracticeInput);
	});
	const canApplyPractice = $derived.by(() => {
		return parsedPracticeInput !== null && validatePracticeNumber(parsedPracticeInput) === null;
	});

	const activePracticeNode = $derived.by(() => {
		if (!activePracticeNodeId) {
			return null;
		}
		return findPracticeNodeById(practiceTree, activePracticeNodeId);
	});

	const displayRoot = $derived.by(() => {
		if (mode === 'example') {
			const tree = buildExploreTree(appliedExploreNumber);
			return toDisplayExploreTree(tree);
		}

		return toDisplayPracticeTree(practiceTree, activePracticeNodeId);
	});

	const treeLayout = $derived.by(() => buildDisplayLayout(displayRoot));

	const explorePrimeFactors = $derived.by(() => factorize(appliedExploreNumber));
	const exploreFactorizationExpression = $derived.by(() =>
		combineProductAndCondensed(appliedExploreNumber, explorePrimeFactors)
	);

	const practicePrimeFactors = $derived.by(() => {
		const factors: number[] = [];
		collectPrimeLeaves(practiceTree, factors);
		factors.sort((left, right) => left - right);
		return factors;
	});
	const practiceFactorizationExpression = $derived.by(() =>
		combineProductAndCondensed(practiceTree.value, practicePrimeFactors)
	);

	const practiceComplete = $derived(mode === 'practice' && activePracticeNodeId === null);

	const factorTreeBackgroundStyle = `background: linear-gradient(140deg, ${TOOL_BG_GRADIENT_START} 0%, ${TOOL_BG_GRADIENT_END} 100%);`;
	const treeSurfaceStyle = `background: ${TOOL_BG_SURFACE_WASH};`;

	function autofocusPlaceholder(node: HTMLInputElement, enabled: boolean) {
		let frame = 0;

		const focusInput = () => {
			if (!enabled) {
				return;
			}

			frame = requestAnimationFrame(() => {
				node.focus();
				node.select();
			});
		};

		focusInput();

		return {
			update(nextEnabled: boolean) {
				enabled = nextEnabled;
				cancelAnimationFrame(frame);
				focusInput();
			},
			destroy() {
				cancelAnimationFrame(frame);
			}
		};
	}
</script>

<div class="prime-factorization-tool space-y-4">
	<div class="rounded-xl border border-border/70 bg-background/75 p-4">
		<div class="space-y-4">
			<div class="flex flex-wrap gap-2">
				<button
					type="button"
					class={`rounded-md border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
						mode === 'example'
							? 'border-primary/60 bg-primary/12 text-primary'
							: 'border-border/70 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
					}`}
					onclick={() => setMode('example')}
				>
					Example
				</button>
				<button
					type="button"
					class={`rounded-md border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
						mode === 'practice'
							? 'border-primary/60 bg-primary/12 text-primary'
							: 'border-border/70 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
					}`}
					onclick={() => setMode('practice')}
				>
					Practice
				</button>
			</div>

				{#if mode === 'example'}
					<div class="space-y-3">
						<form class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end" onsubmit={submitExploreNumber}>
							<label class="space-y-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Choose a number
								<input
									type="number"
									min="2"
									max={MAX_NUMBER}
									step="1"
									value={exploreInput}
									oninput={(event) => {
										exploreInput = (event.currentTarget as HTMLInputElement).value;
									}}
									class="mt-1 h-10 w-full rounded-lg border border-border/70 bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-primary"
								/>
							</label>
							<button
								type="submit"
								class="h-10 rounded-lg border border-primary/40 bg-primary/10 px-3 text-xs font-semibold uppercase tracking-wide text-primary transition-colors hover:bg-primary/18 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-32"
								disabled={!canApplyExplore}
							>
								Build tree
							</button>
						</form>
						{#if exploreValidationMessage}
							<p class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
								{exploreValidationMessage}
							</p>
						{:else}
							<p class="text-xs text-muted-foreground">
								Build a factor tree for any whole number from 2 to {MAX_NUMBER}.
							</p>
						{/if}
					</div>
				{:else}
				<div class="space-y-3">
					<form
						class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end"
						onsubmit={submitPracticeNumber}
					>
						<label class="space-y-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Choose a number
							<input
								type="number"
								min="4"
								max={MAX_NUMBER}
								step="1"
								value={practiceInput}
								oninput={(event) => {
									practiceInput = (event.currentTarget as HTMLInputElement).value;
								}}
								class="mt-1 h-10 w-full rounded-lg border border-border/70 bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-primary"
							/>
						</label>
						<button
							type="submit"
							class="h-10 rounded-lg border border-primary/40 bg-primary/10 px-3 text-xs font-semibold uppercase tracking-wide text-primary transition-colors hover:bg-primary/18 disabled:cursor-not-allowed disabled:opacity-50"
							disabled={!canApplyPractice}
						>
							Start practice
						</button>
						<button
							type="button"
							class="h-10 rounded-lg border border-border/70 bg-background px-3 text-xs font-semibold uppercase tracking-wide text-foreground transition-colors hover:border-primary/40"
							onclick={() => startNewPractice()}
						>
							Random problem
						</button>
					</form>
						{#if practiceValidationMessage}
							<p class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
								{practiceValidationMessage}
							</p>
						{:else}
							<p class="text-xs text-muted-foreground">
								Type factors into the two empty child nodes, then press
								<span class="font-semibold text-foreground">Enter</span>
								or
								<span class="font-semibold text-foreground">Check factors</span>.
								Use
								<span class="font-semibold text-foreground">Tab</span>
								to move to the next node.
							</p>
						{/if}
					</div>
				{/if}
			</div>
		</div>

	<section class="rounded-xl border border-border/70 p-3" style={factorTreeBackgroundStyle}>
		<p class="text-xs font-semibold uppercase tracking-wide text-slate-700">Factor tree</p>
		<div class="mt-2 rounded-lg border border-slate-300/60 p-2" style={treeSurfaceStyle}>
			<svg
				viewBox={`0 0 ${treeLayout.width} ${treeLayout.height}`}
				class="h-auto w-full rounded-md"
				role="img"
				aria-label={`Factor tree for ${mode === 'example' ? appliedExploreNumber : practiceTree.value}`}
			>
				<rect x="0" y="0" width={treeLayout.width} height={treeLayout.height} fill="rgba(248,250,252,0.82)"></rect>
				{#each treeLayout.edges as edge (edge.id)}
					<line
						x1={edge.x1}
						y1={edge.y1 + NODE_RADIUS}
						x2={edge.x2}
						y2={edge.y2 - NODE_RADIUS}
						stroke="rgba(51,65,85,0.52)"
						stroke-width="2"
					></line>
				{/each}
				{#each treeLayout.nodes as node (node.id)}
					{#if node.isPlaceholder}
						<circle
							cx={node.x}
							cy={node.y}
							r={NODE_RADIUS}
							fill="rgba(226,232,240,0.62)"
							stroke="rgba(71,85,105,0.52)"
							stroke-width="1.5"
							stroke-dasharray="4 3"
						></circle>
						<foreignObject x={node.x - 20} y={node.y - 11} width="40" height="22">
							<div xmlns="http://www.w3.org/1999/xhtml" style="height:100%;width:100%;display:flex;align-items:center;justify-content:center;">
								<input
									type="number"
									min="2"
									step="1"
									use:autofocusPlaceholder={node.side === 'left'}
									value={node.side === 'left' ? leftFactorInput : rightFactorInput}
									onkeydown={submitPracticeFactorsWithEnter}
									oninput={(event) => {
										const value = (event.currentTarget as HTMLInputElement).value;
										if (node.side === 'left') {
											leftFactorInput = value;
										} else {
											rightFactorInput = value;
										}
									}}
									style="width:100%;height:100%;font-size:11px;text-align:center;border:1px solid rgba(148,163,184,0.9);border-radius:6px;background:white;color:#0f172a;"
								/>
							</div>
						</foreignObject>
					{:else}
						<circle
							cx={node.x}
							cy={node.y}
							r={NODE_RADIUS}
							fill={node.isPrime ? 'rgba(14,165,233,0.18)' : 'rgba(45,212,191,0.2)'}
							stroke={node.isActive ? 'rgba(245,158,11,0.9)' : 'rgba(15,23,42,0.36)'}
							stroke-width={node.isActive ? 2.3 : 1.5}
						></circle>
						<text
							x={node.x}
							y={node.y + 5}
							text-anchor="middle"
							font-size="14"
							font-weight="600"
							fill="rgb(15 23 42)"
						>
							{node.value}
						</text>
					{/if}
				{/each}
			</svg>
		</div>
		<div class="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-700">
			<span class="inline-flex items-center gap-1.5">
				<span class="size-2.5 rounded-full border border-slate-500/45 bg-teal-300/45"></span>
				Composite
			</span>
			<span class="inline-flex items-center gap-1.5">
				<span class="size-2.5 rounded-full border border-slate-500/45 bg-sky-300/45"></span>
				Prime
			</span>
			{#if mode === 'practice'}
				<span class="inline-flex items-center gap-1.5">
					<span class="size-2.5 rounded-full border border-slate-500/45 bg-slate-200/70"></span>
					Type factors here
				</span>
			{/if}
		</div>
			{#if mode === 'practice'}
				<div class="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<button
						type="button"
						class="rounded-md border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary transition-colors hover:bg-primary/18 disabled:cursor-not-allowed disabled:opacity-45"
						onclick={checkPracticeFactors}
						disabled={!activePracticeNodeId}
				>
					Check factors
				</button>
			</div>

			{#if practiceFeedback?.kind === 'error'}
				<p
					class="mt-3 rounded-lg border border-rose-300/70 bg-rose-100/70 px-3 py-2 text-xs text-rose-900"
				>
					{practiceFeedback.message}
				</p>
			{/if}

			{#if practiceComplete}
				<p class="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-700">
					Prime factorization complete
				</p>
				<MathExpression
					math={practiceFactorizationExpression}
					displayMode
					class="mt-1 text-sm text-slate-900"
				/>
			{/if}
		{:else}
			<p class="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-700">
				Prime factorization
			</p>
			<MathExpression
				math={exploreFactorizationExpression}
				displayMode
				class="mt-1 text-sm text-slate-900"
			/>
		{/if}
	</section>
</div>

<style>
	:global(.prime-factorization-tool input[type='number']) {
		appearance: textfield;
		-moz-appearance: textfield;
	}

	:global(.prime-factorization-tool input[type='number']::-webkit-outer-spin-button),
	:global(.prime-factorization-tool input[type='number']::-webkit-inner-spin-button) {
		-webkit-appearance: none;
		margin: 0;
	}
</style>
