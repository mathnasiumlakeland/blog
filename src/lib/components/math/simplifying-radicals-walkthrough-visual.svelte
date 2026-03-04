<script module lang="ts">
	import type { MathToolMeta } from './tool-meta';
	import { requireInteractiveToolMetaById } from './tool-registry';

	export const toolMeta: MathToolMeta = requireInteractiveToolMetaById(
		'simplifying-radicals-walkthrough'
	);
</script>

<script lang="ts">
	import MathExpression from '$lib/components/math/math-expression.svelte';
	import {
		TOOL_BG_GRADIENT_END,
		TOOL_BG_GRADIENT_START,
		TOOL_BG_SURFACE_WASH
	} from './tool-visual-theme';

	type FactorTreeNode = {
		value: number;
		left?: FactorTreeNode;
		right?: FactorTreeNode;
	};

	type PairGroup = {
		prime: number;
		count: number;
		pairCount: number;
		leftoverCount: number;
	};

	type TreeLayoutNode = {
		id: string;
		value: number;
		x: number;
		y: number;
		isLeaf: boolean;
	};

	type TreeLayoutEdge = {
		id: string;
		x1: number;
		y1: number;
		x2: number;
		y2: number;
	};

	type TreeLayout = {
		width: number;
		height: number;
		nodes: TreeLayoutNode[];
		edges: TreeLayoutEdge[];
	};

	type SimplificationResult = {
		radicand: number;
		factorTree: FactorTreeNode;
		treeLayout: TreeLayout;
		primeFactors: number[];
		pairGroups: PairGroup[];
		outsideFactors: number[];
		leftoverFactors: number[];
		pairSquares: number[];
		outsideProduct: number;
		insideProduct: number;
		underSingleRadical: string;
		groupedPairsUnderRadical: string;
		multipliedPairsUnderRadical: string;
		splitRadicals: string;
		simplifiedFactors: string;
		finalExpression: string;
		finalEquation: string;
	};

	const MAX_RADICAND = 1000;
	const FACTOR_TREE_NODE_RADIUS = 24;
	const sampleValues = [48, 72, 180, 300];

	let radicandInput = $state('72');
	let appliedRadicand = $state<number | null>(72);

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

	function getRadicandValidationMessage(value: number | null) {
		if (value === null) {
			return 'Enter a whole number to start.';
		}
		if (value < 2) {
			return 'Use a whole number greater than or equal to 2 so prime factorization is defined.';
		}
		if (value > MAX_RADICAND) {
			return `Use ${MAX_RADICAND.toLocaleString()} or smaller so the factor tree stays readable.`;
		}
		return null;
	}

	const parsedRadicand = $derived.by(() => {
		return parseWholeNumber(radicandInput);
	});

	const hasTypedInput = $derived.by(() => radicandInput.trim().length > 0);
	const validationMessage = $derived.by(() => {
		if (!hasTypedInput) {
			return null;
		}
		return getRadicandValidationMessage(parsedRadicand);
	});
	const canApplyRadicand = $derived.by(() => {
		return parsedRadicand !== null && getRadicandValidationMessage(parsedRadicand) === null;
	});
	const simplification = $derived.by(() => {
		if (appliedRadicand === null) {
			return null;
		}
		return buildSimplification(appliedRadicand);
	});

	function setExample(value: number) {
		radicandInput = value.toString();
		appliedRadicand = value;
	}

	function applyRadicand() {
		if (!canApplyRadicand || parsedRadicand === null) {
			return;
		}

		appliedRadicand = parsedRadicand;
	}

	function submitRadicand(event: SubmitEvent) {
		event.preventDefault();
		applyRadicand();
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

	function buildFactorTree(value: number): FactorTreeNode {
		if (isPrime(value)) {
			return { value };
		}

		const [leftValue, rightValue] = chooseFactorPair(value);
		return {
			value,
			left: isPrime(leftValue) ? { value: leftValue } : buildFactorTree(leftValue),
			right: isPrime(rightValue) ? { value: rightValue } : buildFactorTree(rightValue)
		};
	}

	function collectPrimeLeaves(node: FactorTreeNode, factors: number[]) {
		const children = [node.left, node.right].filter(
			(child): child is FactorTreeNode => child !== undefined
		);

		if (children.length === 0) {
			factors.push(node.value);
			return;
		}

		for (const child of children) {
			collectPrimeLeaves(child, factors);
		}
	}

	function countLeaves(node: FactorTreeNode): number {
		const children = [node.left, node.right].filter(
			(child): child is FactorTreeNode => child !== undefined
		);
		if (children.length === 0) {
			return 1;
		}
		return children.reduce((sum, child) => sum + countLeaves(child), 0);
	}

	function maxDepth(node: FactorTreeNode): number {
		const children = [node.left, node.right].filter(
			(child): child is FactorTreeNode => child !== undefined
		);
		if (children.length === 0) {
			return 0;
		}
		return 1 + Math.max(...children.map((child) => maxDepth(child)));
	}

	function buildTreeLayout(root: FactorTreeNode): TreeLayout {
		const width = 760;
		const paddingX = 56;
		const paddingTop = 56;
		const verticalGap = 86;
		const leafCount = countLeaves(root);
		const depth = maxDepth(root);
		const usableWidth = width - paddingX * 2;
		const horizontalGap = leafCount === 1 ? 0 : usableWidth / (leafCount - 1);
		const height = paddingTop * 2 + depth * verticalGap;

		const nodes: TreeLayoutNode[] = [];
		const edges: TreeLayoutEdge[] = [];
		let leafCursor = 0;

		function traverse(node: FactorTreeNode, level: number, path: string): { x: number; y: number } {
			const y = paddingTop + level * verticalGap;
			const children = [node.left, node.right].filter(
				(child): child is FactorTreeNode => child !== undefined
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
				value: node.value,
				x,
				y,
				isLeaf: children.length === 0
			});

			return { x, y };
		}

		traverse(root, 0, 'root');
		return { width, height, nodes, edges };
	}

	function multiply(values: number[]): number {
		return values.reduce((product, value) => product * value, 1);
	}

	function productTeX(values: number[]): string {
		if (values.length === 0) {
			return '1';
		}
		return values.join('\\cdot');
	}

	function joinTeXTerms(terms: string[]): string {
		if (terms.length === 0) {
			return '1';
		}
		return terms.join('\\cdot');
	}

	function buildSimplification(radicand: number): SimplificationResult {
		const factorTree = buildFactorTree(radicand);
		const primeFactors: number[] = [];
		collectPrimeLeaves(factorTree, primeFactors);
		primeFactors.sort((left, right) => left - right);

		const counts: Record<number, number> = {};
		for (const factor of primeFactors) {
			counts[factor] = (counts[factor] ?? 0) + 1;
		}

		const pairGroups = Object.entries(counts)
			.map(([prime, count]) => ({
				prime: Number(prime),
				count
			}))
			.sort((left, right) => left.prime - right.prime)
			.map((group) => ({
				prime: group.prime,
				count: group.count,
				pairCount: Math.floor(group.count / 2),
				leftoverCount: group.count % 2
			}));

		const outsideFactors = pairGroups.flatMap((group) => Array(group.pairCount).fill(group.prime));
		const leftoverFactors = pairGroups.flatMap((group) => Array(group.leftoverCount).fill(group.prime));
		const pairSquares = pairGroups.flatMap((group) => Array(group.pairCount).fill(group.prime * group.prime));

		const outsideProduct = multiply(outsideFactors);
		const insideProduct = multiply(leftoverFactors);

		const groupedPairTerms = pairGroups.flatMap((group) => {
			const terms: string[] = [];
			for (let index = 0; index < group.pairCount; index += 1) {
				terms.push(`(${group.prime}\\cdot${group.prime})`);
			}
			for (let index = 0; index < group.leftoverCount; index += 1) {
				terms.push(`${group.prime}`);
			}
			return terms;
		});

		const multipliedPairTerms = [...pairSquares, ...leftoverFactors];
		const splitRadicalsTerms = [
			...pairSquares.map((value) => `\\sqrt{${value}}`),
			...leftoverFactors.map((value) => `\\sqrt{${value}}`)
		];
		const simplifiedFactorTerms = [
			...outsideFactors.map((value) => `${value}`),
			...leftoverFactors.map((value) => `\\sqrt{${value}}`)
		];

		const finalExpression =
			insideProduct === 1
				? `${outsideProduct}`
				: outsideProduct === 1
					? `\\sqrt{${insideProduct}}`
					: `${outsideProduct}\\sqrt{${insideProduct}}`;

		return {
			radicand,
			factorTree,
			treeLayout: buildTreeLayout(factorTree),
			primeFactors,
			pairGroups,
			outsideFactors,
			leftoverFactors,
			pairSquares,
			outsideProduct,
			insideProduct,
			underSingleRadical: `\\sqrt{${productTeX(primeFactors)}}`,
			groupedPairsUnderRadical: `\\sqrt{${joinTeXTerms(groupedPairTerms)}}`,
			multipliedPairsUnderRadical: `\\sqrt{${productTeX(multipliedPairTerms)}}`,
			splitRadicals: joinTeXTerms(splitRadicalsTerms),
			simplifiedFactors: joinTeXTerms(simplifiedFactorTerms),
			finalExpression,
			finalEquation: `\\sqrt{${radicand}}=${finalExpression}`
		};
	}

	const factorTreeBackgroundStyle = `background: linear-gradient(140deg, ${TOOL_BG_GRADIENT_START} 0%, ${TOOL_BG_GRADIENT_END} 100%);`;
	const stepSurfaceStyle = `background: ${TOOL_BG_SURFACE_WASH};`;
</script>

<div class="space-y-4">
	<div class="rounded-xl border border-border/70 bg-background/75 p-4">
		<form class="flex flex-wrap items-end gap-3" onsubmit={submitRadicand}>
			<label class="min-w-52 space-y-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
				Radicand n
				<input
					type="number"
					min="2"
					max={MAX_RADICAND}
					step="1"
					value={radicandInput}
					oninput={(event) => {
						radicandInput = (event.currentTarget as HTMLInputElement).value;
					}}
					class="mt-1 h-10 w-full rounded-lg border border-border/70 bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-primary"
				/>
			</label>
			<button
				type="submit"
				class="h-10 rounded-lg border border-primary/40 bg-primary/10 px-3 text-xs font-semibold uppercase tracking-wide text-primary transition-colors hover:bg-primary/18 disabled:cursor-not-allowed disabled:opacity-50"
				disabled={!canApplyRadicand}
			>
				Enter number
			</button>
			<div class="flex flex-wrap gap-2">
				{#each sampleValues as value (value)}
					<button
						type="button"
						class="rounded-md border border-border/70 bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
						onclick={() => setExample(value)}
					>
						Try {value}
					</button>
				{/each}
			</div>
		</form>
		{#if appliedRadicand !== null}
			<p class="mt-3 text-xs text-muted-foreground">
				Showing steps for
				<MathExpression math={`\\sqrt{${appliedRadicand}}`} class="mx-0.5" />
				. Enter a new number, then press
				<span class="font-semibold text-foreground">Enter number</span>.
			</p>
		{:else}
			<p class="mt-3 text-xs text-muted-foreground">
				No number applied yet. Enter a whole number from
				<span class="font-semibold text-foreground">2 to {MAX_RADICAND}</span>
				then press
				<span class="font-semibold text-foreground">Enter number</span>.
			</p>
		{/if}
		{#if validationMessage}
			<p class="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
				{validationMessage}
			</p>
		{/if}
	</div>

	<div class={`space-y-4 transition-opacity ${simplification ? 'opacity-100' : 'opacity-45'}`}>
		{#if simplification}
			<div class="grid grid-cols-1 gap-3 lg:grid-cols-5">
				<section class="lg:col-span-3 rounded-xl border border-border/70 p-3" style={factorTreeBackgroundStyle}>
					<p class="text-xs font-semibold uppercase tracking-wide text-slate-700">Factor tree</p>
					<div class="mt-2 rounded-lg border border-slate-300/60 p-2" style={stepSurfaceStyle}>
						<svg
							viewBox={`0 0 ${simplification.treeLayout.width} ${simplification.treeLayout.height}`}
							class="h-auto w-full rounded-md"
							role="img"
							aria-label={`Factor tree for ${simplification.radicand}`}
						>
							<rect
								x="0"
								y="0"
								width={simplification.treeLayout.width}
								height={simplification.treeLayout.height}
								fill="rgba(248,250,252,0.82)"
							></rect>
							{#each simplification.treeLayout.edges as edge (edge.id)}
								<line
									x1={edge.x1}
									y1={edge.y1 + FACTOR_TREE_NODE_RADIUS}
									x2={edge.x2}
									y2={edge.y2 - FACTOR_TREE_NODE_RADIUS}
									stroke="rgba(51,65,85,0.52)"
									stroke-width="2"
								></line>
							{/each}
							{#each simplification.treeLayout.nodes as node (node.id)}
								<circle
									cx={node.x}
									cy={node.y}
									r={FACTOR_TREE_NODE_RADIUS}
									fill={node.isLeaf ? 'rgba(14,165,233,0.18)' : 'rgba(45,212,191,0.2)'}
									stroke="rgba(15,23,42,0.36)"
									stroke-width="1.5"
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
					</div>
				</section>

				<section class="lg:col-span-2 rounded-xl border border-border/70 bg-background/80 p-3">
					<p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						Prime factorization
					</p>
					<MathExpression
						math={`${simplification.radicand}=${productTeX(simplification.primeFactors)}`}
						displayMode
						class="mt-2 text-sm text-foreground"
					/>
				</section>
			</div>

			<div class="space-y-3">
				<section class="rounded-xl border border-border/70 bg-background/75 p-3">
					<p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						1. Put prime factors under one radical
					</p>
					<MathExpression
						math={simplification.underSingleRadical}
						displayMode
						class="mt-2 text-sm text-foreground"
					/>
				</section>

				<section class="rounded-xl border border-border/70 bg-background/75 p-3">
					<p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						2. Group matching pairs under the radical
					</p>
					<MathExpression
						math={simplification.groupedPairsUnderRadical}
						displayMode
						class="mt-2 text-sm text-foreground"
					/>
				</section>

				<section class="rounded-xl border border-border/70 bg-background/75 p-3">
					<p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						3. Multiply each pair inside the radical
					</p>
					<MathExpression
						math={simplification.multipliedPairsUnderRadical}
						displayMode
						class="mt-2 text-sm text-foreground"
					/>
				</section>

				<section class="rounded-xl border border-border/70 bg-background/75 p-3">
					<p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						4. Split into separate radicals
					</p>
					<MathExpression math={simplification.splitRadicals} displayMode class="mt-2 text-sm text-foreground" />
				</section>

				<section class="rounded-xl border border-border/70 bg-background/75 p-3">
					<p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						5. Simplify each square-root factor
					</p>
					<MathExpression
						math={simplification.simplifiedFactors}
						displayMode
						class="mt-2 text-sm text-foreground"
					/>
				</section>
			</div>

			<section class="rounded-xl border border-primary/30 bg-primary/8 p-3">
				<p class="text-xs font-semibold uppercase tracking-wide text-primary">Final simplified radical</p>
				<MathExpression math={simplification.finalEquation} displayMode class="mt-2 text-base text-foreground" />
			</section>
		{:else}
			<section
				class="rounded-xl border border-dashed border-border/80 bg-background/70 px-4 py-10 text-center"
			>
				<p class="text-sm font-medium text-foreground">Walkthrough preview is waiting for a number.</p>
				<p class="mt-2 text-xs text-muted-foreground">
					Enter a whole number from 2 to {MAX_RADICAND}, then click
					<span class="font-semibold text-foreground">Enter number</span>.
				</p>
			</section>
		{/if}
	</div>
</div>
