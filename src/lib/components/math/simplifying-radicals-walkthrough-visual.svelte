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

	type Mode = 'walkthrough' | 'practice';

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

	type PracticeGroupedTerm =
		| {
				kind: 'pair';
				prime: number;
		  }
		| {
				kind: 'single';
				prime: number;
		  };

	type PracticeGroupedRenderTerm =
		| {
				kind: 'pair';
				firstIndex: number;
				secondIndex: number;
		  }
		| {
				kind: 'single';
				index: number;
		  };

	type WalkthroughTreeLayoutNode = {
		id: string;
		value: number;
		x: number;
		y: number;
		isLeaf: boolean;
	};

	type WalkthroughTreeLayoutEdge = {
		id: string;
		x1: number;
		y1: number;
		x2: number;
		y2: number;
	};

	type WalkthroughTreeLayout = {
		width: number;
		height: number;
		nodes: WalkthroughTreeLayoutNode[];
		edges: WalkthroughTreeLayoutEdge[];
	};

	type PracticeNode = {
		id: string;
		value: number;
		expanded: boolean;
		left?: PracticeNode;
		right?: PracticeNode;
	};

	type PracticeDisplayNode = {
		id: string;
		value: number | null;
		isPrime: boolean;
		isPlaceholder: boolean;
		side: 'left' | 'right' | null;
		isActive: boolean;
		left?: PracticeDisplayNode;
		right?: PracticeDisplayNode;
	};

	type PracticeTreeLayoutNode = {
		id: string;
		x: number;
		y: number;
		value: number | null;
		isPrime: boolean;
		isPlaceholder: boolean;
		side: 'left' | 'right' | null;
		isActive: boolean;
	};

	type PracticeTreeLayoutEdge = {
		id: string;
		x1: number;
		y1: number;
		x2: number;
		y2: number;
	};

	type PracticeTreeLayout = {
		width: number;
		height: number;
		nodes: PracticeTreeLayoutNode[];
		edges: PracticeTreeLayoutEdge[];
	};

	type Feedback = {
		kind: 'ok' | 'error' | 'info';
		message: string;
	};

	type SimplificationResult = {
		radicand: number;
		factorTree: FactorTreeNode;
		treeLayout: WalkthroughTreeLayout;
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
	const practiceInsideCandidates = [2, 3, 5, 6, 7, 10, 11, 13];

	let mode = $state<Mode>('walkthrough');

	let radicandInput = $state('72');
	let appliedRadicand = $state<number | null>(72);

	let practiceNodeCounter = 0;
	const initialPracticeRadicand = pickPracticeRadicand();
	const initialPracticeTree = createPracticeRoot(initialPracticeRadicand);
	const initialPracticeSimplification = buildSimplification(initialPracticeRadicand);
	const initialPracticeGroupedTerms = buildGroupedPracticeTerms(initialPracticeSimplification.pairGroups);
	const initialPracticeGroupedExpectedValues = flattenGroupedPracticeTerms(initialPracticeGroupedTerms);
	const initialPracticeMultipliedValues = [
		...initialPracticeSimplification.pairSquares,
		...initialPracticeSimplification.leftoverFactors
	];

	let practiceTree = $state(initialPracticeTree);
	let activePracticeNodeId = $state(getNextExpandableNodeId(initialPracticeTree));
	let leftFactorInput = $state('');
	let rightFactorInput = $state('');
	let practiceFactorTreeFeedback = $state<Feedback | null>({
		kind: 'info',
		message: 'Split the highlighted node into two factors greater than 1.'
	});

	let practicePrimeFactorInputs = $state(createBlankInputs(initialPracticeSimplification.primeFactors.length));
	let practicePrimeFactorFeedback = $state<Feedback | null>(null);
	let practiceGroupedInputs = $state(createBlankInputs(initialPracticeGroupedExpectedValues.length));
	let practiceGroupedFeedback = $state<Feedback | null>(null);
	let practiceMultipliedInputs = $state(createBlankInputs(initialPracticeMultipliedValues.length));
	let practiceMultipliedFeedback = $state<Feedback | null>(null);
	let practiceSplitRadicalInputs = $state(createBlankInputs(initialPracticeMultipliedValues.length));
	let practiceSplitFeedback = $state<Feedback | null>(null);
	let practiceSimplifiedOutsideInputs = $state(
		createBlankInputs(initialPracticeSimplification.outsideFactors.length)
	);
	let practiceSimplifiedInsideInput = $state('');
	let practiceSimplifiedFeedback = $state<Feedback | null>(null);
	let practiceFinalOutsideInput = $state('');
	let practiceFinalInsideInput = $state('');
	let practiceFinalFeedback = $state<Feedback | null>(null);

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

	function setMode(nextMode: Mode) {
		mode = nextMode;
	}

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

	function buildWalkthroughTreeLayout(root: FactorTreeNode): WalkthroughTreeLayout {
		const width = 760;
		const paddingX = 56;
		const paddingTop = 56;
		const verticalGap = 86;
		const leafCount = countLeaves(root);
		const depth = maxDepth(root);
		const usableWidth = width - paddingX * 2;
		const horizontalGap = leafCount === 1 ? 0 : usableWidth / (leafCount - 1);
		const height = paddingTop * 2 + depth * verticalGap;

		const nodes: WalkthroughTreeLayoutNode[] = [];
		const edges: WalkthroughTreeLayoutEdge[] = [];
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

	function buildGroupedPracticeTerms(pairGroups: PairGroup[]): PracticeGroupedTerm[] {
		return pairGroups.flatMap((group) => {
			const terms: PracticeGroupedTerm[] = [];
			for (let index = 0; index < group.pairCount; index += 1) {
				terms.push({ kind: 'pair', prime: group.prime });
			}
			for (let index = 0; index < group.leftoverCount; index += 1) {
				terms.push({ kind: 'single', prime: group.prime });
			}
			return terms;
		});
	}

	function flattenGroupedPracticeTerms(terms: PracticeGroupedTerm[]) {
		return terms.flatMap((term) =>
			term.kind === 'pair' ? [term.prime, term.prime] : [term.prime]
		);
	}

	function buildGroupedPracticeRenderTerms(terms: PracticeGroupedTerm[]): PracticeGroupedRenderTerm[] {
		let cursor = 0;

		return terms.map((term) => {
			if (term.kind === 'pair') {
				const renderTerm: PracticeGroupedRenderTerm = {
					kind: 'pair',
					firstIndex: cursor,
					secondIndex: cursor + 1
				};
				cursor += 2;
				return renderTerm;
			}

			const renderTerm: PracticeGroupedRenderTerm = {
				kind: 'single',
				index: cursor
			};
			cursor += 1;
			return renderTerm;
		});
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
		const leftoverFactors = pairGroups.flatMap((group) =>
			Array(group.leftoverCount).fill(group.prime)
		);
		const pairSquares = pairGroups.flatMap((group) =>
			Array(group.pairCount).fill(group.prime * group.prime)
		);

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
			treeLayout: buildWalkthroughTreeLayout(factorTree),
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

	function createBlankInputs(length: number) {
		return Array.from({ length }, () => '');
	}

	function setInputAt(values: string[], index: number, nextValue: string) {
		const nextValues = [...values];
		nextValues[index] = nextValue;
		return nextValues;
	}

	function matchesExpectedInputs(inputs: string[], expected: number[], minimum = 1) {
		if (inputs.length !== expected.length) {
			return false;
		}

		return inputs.every((input, index) => {
			const parsed = parseWholeNumber(input);
			return parsed !== null && parsed >= minimum && parsed === expected[index];
		});
	}

	function matchesExpectedValue(input: string, expected: number, minimum = 1) {
		const parsed = parseWholeNumber(input);
		return parsed !== null && parsed >= minimum && parsed === expected;
	}

	function randomInt(min: number, max: number) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	function pickPracticeRadicand() {
		for (let attempt = 0; attempt < 50; attempt += 1) {
			const outside = randomInt(2, 12);
			const inside =
				practiceInsideCandidates[randomInt(0, practiceInsideCandidates.length - 1)] ?? 2;
			const radicand = outside * outside * inside;

			if (radicand <= MAX_RADICAND) {
				return radicand;
			}
		}

		return 72;
	}

	function nextPracticeNodeId() {
		practiceNodeCounter += 1;
		return `sr-${practiceNodeCounter}`;
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

	function toDisplayPracticeTree(node: PracticeNode, activeNodeId: string | null): PracticeDisplayNode {
		const displayNode: PracticeDisplayNode = {
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

	function countPracticeLeaves(node: PracticeDisplayNode): number {
		const children = [node.left, node.right].filter(
			(child): child is PracticeDisplayNode => child !== undefined
		);
		if (children.length === 0) {
			return 1;
		}
		return children.reduce((sum, child) => sum + countPracticeLeaves(child), 0);
	}

	function maxPracticeDepth(node: PracticeDisplayNode): number {
		const children = [node.left, node.right].filter(
			(child): child is PracticeDisplayNode => child !== undefined
		);
		if (children.length === 0) {
			return 0;
		}
		return 1 + Math.max(...children.map((child) => maxPracticeDepth(child)));
	}

	function buildPracticeTreeLayout(root: PracticeDisplayNode): PracticeTreeLayout {
		const width = 760;
		const paddingX = 56;
		const paddingTop = 56;
		const verticalGap = 86;
		const leafCount = countPracticeLeaves(root);
		const depth = maxPracticeDepth(root);
		const usableWidth = width - paddingX * 2;
		const horizontalGap = leafCount === 1 ? 0 : usableWidth / (leafCount - 1);
		const height = paddingTop * 2 + depth * verticalGap;

		const nodes: PracticeTreeLayoutNode[] = [];
		const edges: PracticeTreeLayoutEdge[] = [];
		let leafCursor = 0;

		function traverse(
			node: PracticeDisplayNode,
			level: number,
			path: string
		): { x: number; y: number } {
			const y = paddingTop + level * verticalGap;
			const children = [node.left, node.right].filter(
				(child): child is PracticeDisplayNode => child !== undefined
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

	function collectPracticePrimeLeaves(node: PracticeNode, factors: number[]) {
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
			collectPracticePrimeLeaves(child, factors);
		}
	}

	function resetPracticeAnswerSteps(result: SimplificationResult) {
		const groupedTerms = buildGroupedPracticeTerms(result.pairGroups);
		const groupedExpectedValues = flattenGroupedPracticeTerms(groupedTerms);
		const multipliedValues = [...result.pairSquares, ...result.leftoverFactors];

		practicePrimeFactorInputs = createBlankInputs(result.primeFactors.length);
		practicePrimeFactorFeedback = null;
		practiceGroupedInputs = createBlankInputs(groupedExpectedValues.length);
		practiceGroupedFeedback = null;
		practiceMultipliedInputs = createBlankInputs(multipliedValues.length);
		practiceMultipliedFeedback = null;
		practiceSplitRadicalInputs = createBlankInputs(multipliedValues.length);
		practiceSplitFeedback = null;
		practiceSimplifiedOutsideInputs = createBlankInputs(result.outsideFactors.length);
		practiceSimplifiedInsideInput = '';
		practiceSimplifiedFeedback = null;
		practiceFinalOutsideInput = '';
		practiceFinalInsideInput = '';
		practiceFinalFeedback = null;
	}

	function startNewPractice(value = pickPracticeRadicand()) {
		const nextTree = createPracticeRoot(value);
		const nextSimplification = buildSimplification(value);

		practiceTree = nextTree;
		activePracticeNodeId = getNextExpandableNodeId(nextTree);
		leftFactorInput = '';
		rightFactorInput = '';
		practiceFactorTreeFeedback = {
			kind: 'info',
			message: 'Split the highlighted node into two factors greater than 1.'
		};
		resetPracticeAnswerSteps(nextSimplification);
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
		if (leftValue === null || rightValue === null || leftValue < 2 || rightValue < 2) {
			practiceFactorTreeFeedback = {
				kind: 'error',
				message: 'Enter two whole-number factors greater than 1.'
			};
			return;
		}

		if (leftValue * rightValue !== activeNode.value) {
			practiceFactorTreeFeedback = {
				kind: 'error',
				message: `Not quite. ${leftValue} x ${rightValue} is not ${activeNode.value}. Try again.`
			};
			return;
		}

		const nextTree = expandPracticeNode(practiceTree, activePracticeNodeId, leftValue, rightValue);
		practiceTree = nextTree;
		activePracticeNodeId = getNextExpandableNodeId(nextTree);
		leftFactorInput = '';
		rightFactorInput = '';

		if (activePracticeNodeId === null) {
			practiceFactorTreeFeedback = {
				kind: 'ok',
				message: 'Correct. Tree complete. Now fill in each simplification step below.'
			};
			return;
		}

		practiceFactorTreeFeedback = {
			kind: 'ok',
			message: `Correct: ${leftValue} x ${rightValue} = ${activeNode.value}. Keep going.`
		};
	}

	function submitPracticeFactorsWithEnter(event: KeyboardEvent) {
		if (event.key !== 'Enter') {
			return;
		}
		event.preventDefault();
		checkPracticeFactors();
	}

	function checkPracticePrimeFactors() {
		if (!practiceTreeComplete) {
			return;
		}

		if (!matchesExpectedInputs(practicePrimeFactorInputs, practiceSimplification.primeFactors, 2)) {
			practicePrimeFactorFeedback = {
				kind: 'error',
				message: 'Check the prime factors and keep them in the walkthrough order.'
			};
			return;
		}

		practicePrimeFactorFeedback = {
			kind: 'ok',
			message: 'Correct. Now group the matching pairs.'
		};
	}

	function submitPracticePrimeFactors(event: SubmitEvent) {
		event.preventDefault();
		checkPracticePrimeFactors();
	}

	function checkPracticeGroupedPairs() {
		if (!practicePrimeStepComplete) {
			return;
		}

		if (!matchesExpectedInputs(practiceGroupedInputs, practiceGroupedExpectedValues, 2)) {
			practiceGroupedFeedback = {
				kind: 'error',
				message: 'Keep matching primes together and leave any leftover prime by itself.'
			};
			return;
		}

		practiceGroupedFeedback = {
			kind: 'ok',
			message: 'Correct. Now multiply each pair inside the radical.'
		};
	}

	function submitPracticeGroupedPairs(event: SubmitEvent) {
		event.preventDefault();
		checkPracticeGroupedPairs();
	}

	function checkPracticeMultipliedPairs() {
		if (!practiceGroupedStepComplete) {
			return;
		}

		if (!matchesExpectedInputs(practiceMultipliedInputs, practiceMultipliedValues, 2)) {
			practiceMultipliedFeedback = {
				kind: 'error',
				message: 'Multiply each matching pair, but leave any leftover prime alone.'
			};
			return;
		}

		practiceMultipliedFeedback = {
			kind: 'ok',
			message: 'Correct. Now split the product into separate radicals.'
		};
	}

	function submitPracticeMultipliedPairs(event: SubmitEvent) {
		event.preventDefault();
		checkPracticeMultipliedPairs();
	}

	function checkPracticeSplitRadicals() {
		if (!practiceMultipliedStepComplete) {
			return;
		}

		if (!matchesExpectedInputs(practiceSplitRadicalInputs, practiceMultipliedValues, 2)) {
			practiceSplitFeedback = {
				kind: 'error',
				message: 'Each factor should go into its own radical in the same order.'
			};
			return;
		}

		practiceSplitFeedback = {
			kind: 'ok',
			message: 'Correct. Now simplify each square-root factor.'
		};
	}

	function submitPracticeSplitRadicals(event: SubmitEvent) {
		event.preventDefault();
		checkPracticeSplitRadicals();
	}

	function checkPracticeSimplifiedFactors() {
		if (!practiceSplitStepComplete) {
			return;
		}

		const outsideMatches = matchesExpectedInputs(
			practiceSimplifiedOutsideInputs,
			practiceSimplification.outsideFactors,
			1
		);
		const insideMatches =
			practiceSimplification.insideProduct === 1
				? true
				: matchesExpectedValue(
						practiceSimplifiedInsideInput,
						practiceSimplification.insideProduct,
						1
					);

		if (!outsideMatches || !insideMatches) {
			practiceSimplifiedFeedback = {
				kind: 'error',
				message: 'Pull the perfect-square factors outside and keep only the leftover factor under the radical.'
			};
			return;
		}

		practiceSimplifiedFeedback = {
			kind: 'ok',
			message: 'Correct. Now combine the outside factors for the final answer.'
		};
	}

	function submitPracticeSimplifiedFactors(event: SubmitEvent) {
		event.preventDefault();
		checkPracticeSimplifiedFactors();
	}

	function checkPracticeFinalAnswer() {
		if (!practiceSimplifiedStepComplete) {
			return;
		}

		const outsideMatches = matchesExpectedValue(
			practiceFinalOutsideInput,
			practiceSimplification.outsideProduct,
			1
		);
		const insideMatches =
			practiceSimplification.insideProduct === 1
				? true
				: matchesExpectedValue(practiceFinalInsideInput, practiceSimplification.insideProduct, 1);

		if (!outsideMatches || !insideMatches) {
			practiceFinalFeedback = {
				kind: 'error',
				message: 'Combine the outside factors, then keep the leftover factor inside the radical.'
			};
			return;
		}

		practiceFinalFeedback = {
			kind: 'ok',
			message: 'Correct. Nicely simplified.'
		};
	}

	function submitPracticeFinalAnswer(event: SubmitEvent) {
		event.preventDefault();
		checkPracticeFinalAnswer();
	}

	function autofocusWhenEnabled(node: HTMLInputElement, enabled: boolean) {
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

	const parsedRadicand = $derived.by(() => parseWholeNumber(radicandInput));
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

	const practiceActiveNode = $derived.by(() => {
		if (!activePracticeNodeId) {
			return null;
		}
		return findPracticeNodeById(practiceTree, activePracticeNodeId);
	});
	const practiceDisplayRoot = $derived.by(() =>
		toDisplayPracticeTree(practiceTree, activePracticeNodeId)
	);
	const practiceTreeLayout = $derived.by(() => buildPracticeTreeLayout(practiceDisplayRoot));
	const practicePrimeFactors = $derived.by(() => {
		const factors: number[] = [];
		collectPracticePrimeLeaves(practiceTree, factors);
		factors.sort((left, right) => left - right);
		return factors;
	});
	const practiceFactorizationExpression = $derived(
		`${practiceTree.value}=${productTeX(practicePrimeFactors)}`
	);
	const practiceTreeComplete = $derived(activePracticeNodeId === null);
	const practiceSimplification = $derived.by(() => buildSimplification(practiceTree.value));
	const practiceGroupedTerms = $derived.by(() =>
		buildGroupedPracticeTerms(practiceSimplification.pairGroups)
	);
	const practiceGroupedExpectedValues = $derived.by(() =>
		flattenGroupedPracticeTerms(practiceGroupedTerms)
	);
	const practiceGroupedRenderTerms = $derived.by(() =>
		buildGroupedPracticeRenderTerms(practiceGroupedTerms)
	);
	const practiceMultipliedValues = $derived.by(() => [
		...practiceSimplification.pairSquares,
		...practiceSimplification.leftoverFactors
	]);
	const practicePrimeStepComplete = $derived.by(() => practicePrimeFactorFeedback?.kind === 'ok');
	const practiceGroupedStepComplete = $derived.by(() => practiceGroupedFeedback?.kind === 'ok');
	const practiceMultipliedStepComplete = $derived.by(() => practiceMultipliedFeedback?.kind === 'ok');
	const practiceSplitStepComplete = $derived.by(() => practiceSplitFeedback?.kind === 'ok');
	const practiceSimplifiedStepComplete = $derived.by(() => practiceSimplifiedFeedback?.kind === 'ok');
	const practiceFinalStepComplete = $derived.by(() => practiceFinalFeedback?.kind === 'ok');

	const factorTreeBackgroundStyle = `background: linear-gradient(140deg, ${TOOL_BG_GRADIENT_START} 0%, ${TOOL_BG_GRADIENT_END} 100%);`;
	const stepSurfaceStyle = `background: ${TOOL_BG_SURFACE_WASH};`;
</script>

<div class="simplifying-radicals-walkthrough-tool space-y-4">
	<div class="rounded-xl border border-border/70 bg-background/75 p-4">
		<div class="flex flex-wrap gap-2">
			<button
				type="button"
				class={`rounded-md border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
					mode === 'walkthrough'
						? 'border-primary/60 bg-primary/12 text-primary'
						: 'border-border/70 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
				}`}
				onclick={() => setMode('walkthrough')}
			>
				Walkthrough
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

		{#if mode === 'walkthrough'}
			<form class="mt-3 flex flex-wrap items-end gap-3" onsubmit={submitRadicand}>
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
		{:else}
			<div class="mt-3 flex flex-wrap items-center gap-2">
				<button
					type="button"
					class="rounded-md border border-border/70 bg-background px-3 py-1 text-xs font-semibold uppercase tracking-wide text-foreground transition-colors hover:border-primary/40"
					onclick={() => startNewPractice()}
				>
					New problem
				</button>
				<p class="text-xs text-muted-foreground">
					Build a factor tree for
					<MathExpression math={`\\sqrt{${practiceTree.value}}`} class="mx-0.5" />
					then fill in every simplification step until you reach
					<MathExpression math={`a\\sqrt{b}`} class="mx-0.5" />.
				</p>
			</div>
			<p class="mt-2 text-xs text-muted-foreground">
				Type factors into the two empty child nodes, then press
				<span class="font-semibold text-foreground">Enter</span>
				or
				<span class="font-semibold text-foreground">Check factors</span>.
				Use
				<span class="font-semibold text-foreground">Tab</span>
				to jump to the next node.
			</p>
		{/if}
	</div>

	{#if mode === 'walkthrough'}
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
						<MathExpression
							math={simplification.splitRadicals}
							displayMode
							class="mt-2 text-sm text-foreground"
						/>
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
	{:else}
		<div class="space-y-4">
			<div class="grid grid-cols-1 gap-3 lg:grid-cols-5">
				<section class="lg:col-span-3 rounded-xl border border-border/70 p-3" style={factorTreeBackgroundStyle}>
					<p class="text-xs font-semibold uppercase tracking-wide text-slate-700">1. Build the factor tree</p>
					<div class="mt-2 rounded-lg border border-slate-300/60 p-2" style={stepSurfaceStyle}>
						<svg
							viewBox={`0 0 ${practiceTreeLayout.width} ${practiceTreeLayout.height}`}
							class="h-auto w-full rounded-md"
							role="img"
							aria-label={`Practice factor tree for ${practiceTree.value}`}
						>
							<rect
								x="0"
								y="0"
								width={practiceTreeLayout.width}
								height={practiceTreeLayout.height}
								fill="rgba(248,250,252,0.82)"
							></rect>
							{#each practiceTreeLayout.edges as edge (edge.id)}
								<line
									x1={edge.x1}
									y1={edge.y1 + FACTOR_TREE_NODE_RADIUS}
									x2={edge.x2}
									y2={edge.y2 - FACTOR_TREE_NODE_RADIUS}
									stroke="rgba(51,65,85,0.52)"
									stroke-width="2"
								></line>
							{/each}
							{#each practiceTreeLayout.nodes as node (node.id)}
								{#if node.isPlaceholder}
									<circle
										cx={node.x}
										cy={node.y}
										r={FACTOR_TREE_NODE_RADIUS}
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
												use:autofocusWhenEnabled={node.side === 'left'}
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
										r={FACTOR_TREE_NODE_RADIUS}
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
						<span class="inline-flex items-center gap-1.5">
							<span class="size-2.5 rounded-full border border-slate-500/45 bg-slate-200/70"></span>
							Type factors here
						</span>
					</div>
				</section>

				<section class="lg:col-span-2 rounded-xl border border-border/70 bg-background/80 p-3">
					<p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						Factor tree practice
					</p>
					{#if practiceActiveNode}
						<p class="mt-2 text-xs text-muted-foreground">
							Split the highlighted node:
							<span class="font-semibold text-foreground">{practiceActiveNode.value}</span>
						</p>
						<MathExpression
							math={`${practiceActiveNode.value}=\\square\\cdot\\square`}
							displayMode
							class="mt-2 text-sm text-foreground"
						/>
					{:else}
						<p class="mt-2 text-xs text-muted-foreground">
							Tree complete. Keep the same walkthrough order for the steps below.
						</p>
						<MathExpression
							math={practiceFactorizationExpression}
							displayMode
							class="mt-2 text-sm text-foreground"
						/>
					{/if}

					<div class="mt-3 flex flex-wrap gap-2">
						<button
							type="button"
							class="rounded-md border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary transition-colors hover:bg-primary/18 disabled:cursor-not-allowed disabled:opacity-45"
							onclick={checkPracticeFactors}
							disabled={!activePracticeNodeId}
						>
							Check factors
						</button>
						<button
							type="button"
							class="rounded-md border border-border/70 bg-background px-3 py-1 text-xs font-semibold uppercase tracking-wide text-foreground transition-colors hover:border-primary/40"
							onclick={() => startNewPractice()}
						>
							New problem
						</button>
					</div>

					{#if practiceFactorTreeFeedback}
						<p
							class={`mt-3 rounded-lg border px-3 py-2 text-xs ${
								practiceFactorTreeFeedback.kind === 'ok'
									? 'border-emerald-300/70 bg-emerald-100/65 text-emerald-900'
									: practiceFactorTreeFeedback.kind === 'error'
										? 'border-rose-300/70 bg-rose-100/70 text-rose-900'
										: 'border-slate-300/70 bg-slate-100/70 text-slate-800'
							}`}
						>
							{practiceFactorTreeFeedback.message}
						</p>
					{/if}
				</section>
			</div>

			{#if practiceTreeComplete}
				<section class="rounded-xl border border-border/70 bg-background/80 p-3">
					<p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						Prime factorization
					</p>
					<MathExpression
						math={practiceFactorizationExpression}
						displayMode
						class="mt-2 text-sm text-foreground"
					/>
				</section>

				<div class="space-y-3">
					<section class="rounded-xl border border-border/70 bg-background/75 p-3">
						<p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							2. Put prime factors under one radical
						</p>
						<form class="mt-3 space-y-3" onsubmit={submitPracticePrimeFactors}>
							<div class="practice-expression" aria-label="Prime factors under one radical">
								<span class="practice-radical">
									<span class="practice-radical__glyph" aria-hidden="true">
										<svg viewBox="0 0 26 44" focusable="false">
											<path
												d="M2 24 L8 40 L16 6 L24 6"
												fill="none"
												stroke="currentColor"
												stroke-width="3.2"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
										</svg>
									</span>
									<span class="practice-radical__body">
								{#each practicePrimeFactorInputs as value, index (index)}
									<input
										type="number"
										min="2"
										step="1"
										use:autofocusWhenEnabled={practiceTreeComplete && !practicePrimeStepComplete && index === 0}
										value={value}
										disabled={practicePrimeStepComplete}
										aria-label={`Prime factor ${index + 1}`}
										oninput={(event) => {
											practicePrimeFactorInputs = setInputAt(
												practicePrimeFactorInputs,
												index,
												(event.currentTarget as HTMLInputElement).value
											);
										}}
										class="practice-expression__input"
									/>
									{#if index < practicePrimeFactorInputs.length - 1}
												<span class="practice-expression__dot" aria-hidden="true">·</span>
									{/if}
								{/each}
									</span>
								</span>
							</div>
							<button
								type="submit"
								class="rounded-md border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary transition-colors hover:bg-primary/18 disabled:cursor-not-allowed disabled:opacity-45"
								disabled={practicePrimeStepComplete}
							>
								Check step 2
							</button>
						</form>
						{#if practicePrimeFactorFeedback}
							<p
								class={`mt-3 rounded-lg border px-3 py-2 text-xs ${
									practicePrimeFactorFeedback.kind === 'ok'
										? 'border-emerald-300/70 bg-emerald-100/65 text-emerald-900'
										: 'border-rose-300/70 bg-rose-100/70 text-rose-900'
								}`}
							>
								{practicePrimeFactorFeedback.message}
							</p>
						{/if}
					</section>

					<section
						class={`rounded-xl border border-border/70 bg-background/75 p-3 transition-opacity ${
							practicePrimeStepComplete ? 'opacity-100' : 'opacity-55'
						}`}
					>
						<p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							3. Group matching pairs under the radical
						</p>
						<form class="mt-3 space-y-3" onsubmit={submitPracticeGroupedPairs}>
							<div class="practice-expression" aria-label="Grouped pairs under one radical">
								<span class="practice-radical">
									<span class="practice-radical__glyph" aria-hidden="true">
										<svg viewBox="0 0 26 44" focusable="false">
											<path
												d="M2 24 L8 40 L16 6 L24 6"
												fill="none"
												stroke="currentColor"
												stroke-width="3.2"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
										</svg>
									</span>
									<span class="practice-radical__body">
								{#each practiceGroupedRenderTerms as term, index (index)}
									{#if term.kind === 'pair'}
												<span class="practice-expression__group">
													<span class="practice-expression__paren" aria-hidden="true">(</span>
													<input
														type="number"
														min="2"
														step="1"
														use:autofocusWhenEnabled={practicePrimeStepComplete && !practiceGroupedStepComplete && index === 0}
														value={practiceGroupedInputs[term.firstIndex] ?? ''}
														disabled={!practicePrimeStepComplete || practiceGroupedStepComplete}
														aria-label={`Grouped factor ${term.firstIndex + 1}`}
														oninput={(event) => {
															practiceGroupedInputs = setInputAt(
																practiceGroupedInputs,
																term.firstIndex,
																(event.currentTarget as HTMLInputElement).value
															);
														}}
														class="practice-expression__input"
													/>
													<span class="practice-expression__dot" aria-hidden="true">·</span>
													<input
														type="number"
														min="2"
														step="1"
														value={practiceGroupedInputs[term.secondIndex] ?? ''}
														disabled={!practicePrimeStepComplete || practiceGroupedStepComplete}
														aria-label={`Grouped factor ${term.secondIndex + 1}`}
														oninput={(event) => {
															practiceGroupedInputs = setInputAt(
																practiceGroupedInputs,
																term.secondIndex,
																(event.currentTarget as HTMLInputElement).value
															);
														}}
														class="practice-expression__input"
													/>
													<span class="practice-expression__paren" aria-hidden="true">)</span>
												</span>
									{:else}
										<input
											type="number"
											min="2"
											step="1"
											use:autofocusWhenEnabled={practicePrimeStepComplete && !practiceGroupedStepComplete && index === 0}
											value={practiceGroupedInputs[term.index] ?? ''}
											disabled={!practicePrimeStepComplete || practiceGroupedStepComplete}
											aria-label={`Grouped factor ${term.index + 1}`}
											oninput={(event) => {
												practiceGroupedInputs = setInputAt(
													practiceGroupedInputs,
													term.index,
													(event.currentTarget as HTMLInputElement).value
												);
											}}
											class="practice-expression__input"
										/>
									{/if}

									{#if index < practiceGroupedRenderTerms.length - 1}
												<span class="practice-expression__dot" aria-hidden="true">·</span>
									{/if}
								{/each}
									</span>
								</span>
							</div>
							<button
								type="submit"
								class="rounded-md border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary transition-colors hover:bg-primary/18 disabled:cursor-not-allowed disabled:opacity-45"
								disabled={!practicePrimeStepComplete || practiceGroupedStepComplete}
							>
								Check step 3
							</button>
						</form>
						{#if practiceGroupedFeedback}
							<p
								class={`mt-3 rounded-lg border px-3 py-2 text-xs ${
									practiceGroupedFeedback.kind === 'ok'
										? 'border-emerald-300/70 bg-emerald-100/65 text-emerald-900'
										: 'border-rose-300/70 bg-rose-100/70 text-rose-900'
								}`}
							>
								{practiceGroupedFeedback.message}
							</p>
						{/if}
					</section>

					<section
						class={`rounded-xl border border-border/70 bg-background/75 p-3 transition-opacity ${
							practiceGroupedStepComplete ? 'opacity-100' : 'opacity-55'
						}`}
					>
						<p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							4. Multiply each pair inside the radical
						</p>
						<form class="mt-3 space-y-3" onsubmit={submitPracticeMultipliedPairs}>
							<div class="practice-expression" aria-label="Multiplied factors under one radical">
								<span class="practice-radical">
									<span class="practice-radical__glyph" aria-hidden="true">
										<svg viewBox="0 0 26 44" focusable="false">
											<path
												d="M2 24 L8 40 L16 6 L24 6"
												fill="none"
												stroke="currentColor"
												stroke-width="3.2"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
										</svg>
									</span>
									<span class="practice-radical__body">
								{#each practiceMultipliedInputs as value, index (index)}
									<input
										type="number"
										min="2"
										step="1"
										use:autofocusWhenEnabled={practiceGroupedStepComplete && !practiceMultipliedStepComplete && index === 0}
										value={value}
										disabled={!practiceGroupedStepComplete || practiceMultipliedStepComplete}
										aria-label={`Multiplied factor ${index + 1}`}
										oninput={(event) => {
											practiceMultipliedInputs = setInputAt(
												practiceMultipliedInputs,
												index,
												(event.currentTarget as HTMLInputElement).value
											);
										}}
										class="practice-expression__input"
									/>
									{#if index < practiceMultipliedInputs.length - 1}
												<span class="practice-expression__dot" aria-hidden="true">·</span>
									{/if}
								{/each}
									</span>
								</span>
							</div>
							<button
								type="submit"
								class="rounded-md border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary transition-colors hover:bg-primary/18 disabled:cursor-not-allowed disabled:opacity-45"
								disabled={!practiceGroupedStepComplete || practiceMultipliedStepComplete}
							>
								Check step 4
							</button>
						</form>
						{#if practiceMultipliedFeedback}
							<p
								class={`mt-3 rounded-lg border px-3 py-2 text-xs ${
									practiceMultipliedFeedback.kind === 'ok'
										? 'border-emerald-300/70 bg-emerald-100/65 text-emerald-900'
										: 'border-rose-300/70 bg-rose-100/70 text-rose-900'
								}`}
							>
								{practiceMultipliedFeedback.message}
							</p>
						{/if}
					</section>

					<section
						class={`rounded-xl border border-border/70 bg-background/75 p-3 transition-opacity ${
							practiceMultipliedStepComplete ? 'opacity-100' : 'opacity-55'
						}`}
					>
						<p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							5. Split into separate radicals
						</p>
						<form class="mt-3 space-y-3" onsubmit={submitPracticeSplitRadicals}>
							<div class="practice-expression" aria-label="Separate radical factors">
								{#each practiceSplitRadicalInputs as value, index (index)}
									<span class="practice-radical practice-radical--single">
										<span class="practice-radical__glyph" aria-hidden="true">
											<svg viewBox="0 0 26 44" focusable="false">
												<path
													d="M2 24 L8 40 L16 6 L24 6"
													fill="none"
													stroke="currentColor"
													stroke-width="3.2"
													stroke-linecap="round"
													stroke-linejoin="round"
												/>
											</svg>
										</span>
										<span class="practice-radical__body practice-radical__body--single">
											<input
												type="number"
												min="2"
												step="1"
												use:autofocusWhenEnabled={practiceMultipliedStepComplete && !practiceSplitStepComplete && index === 0}
												value={value}
												disabled={!practiceMultipliedStepComplete || practiceSplitStepComplete}
												aria-label={`Split radical ${index + 1}`}
												oninput={(event) => {
													practiceSplitRadicalInputs = setInputAt(
														practiceSplitRadicalInputs,
														index,
														(event.currentTarget as HTMLInputElement).value
													);
												}}
												class="practice-expression__input"
											/>
										</span>
									</span>
									{#if index < practiceSplitRadicalInputs.length - 1}
										<span class="practice-expression__dot" aria-hidden="true">·</span>
									{/if}
								{/each}
							</div>
							<button
								type="submit"
								class="rounded-md border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary transition-colors hover:bg-primary/18 disabled:cursor-not-allowed disabled:opacity-45"
								disabled={!practiceMultipliedStepComplete || practiceSplitStepComplete}
							>
								Check step 5
							</button>
						</form>
						{#if practiceSplitFeedback}
							<p
								class={`mt-3 rounded-lg border px-3 py-2 text-xs ${
									practiceSplitFeedback.kind === 'ok'
										? 'border-emerald-300/70 bg-emerald-100/65 text-emerald-900'
										: 'border-rose-300/70 bg-rose-100/70 text-rose-900'
								}`}
							>
								{practiceSplitFeedback.message}
							</p>
						{/if}
					</section>

					<section
						class={`rounded-xl border border-border/70 bg-background/75 p-3 transition-opacity ${
							practiceSplitStepComplete ? 'opacity-100' : 'opacity-55'
						}`}
					>
						<p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							6. Simplify each square-root factor
						</p>
						<form class="mt-3 space-y-3" onsubmit={submitPracticeSimplifiedFactors}>
							<div class="practice-expression" aria-label="Simplified factors">
								{#each practiceSimplifiedOutsideInputs as value, index (index)}
									<input
										type="number"
										min="1"
										step="1"
										use:autofocusWhenEnabled={practiceSplitStepComplete && !practiceSimplifiedStepComplete && index === 0}
										value={value}
										disabled={!practiceSplitStepComplete || practiceSimplifiedStepComplete}
										aria-label={`Outside factor ${index + 1}`}
										oninput={(event) => {
											practiceSimplifiedOutsideInputs = setInputAt(
												practiceSimplifiedOutsideInputs,
												index,
												(event.currentTarget as HTMLInputElement).value
											);
										}}
										class="practice-expression__input"
									/>
									{#if index < practiceSimplifiedOutsideInputs.length - 1 || practiceSimplification.insideProduct > 1}
										<span class="practice-expression__dot" aria-hidden="true">·</span>
									{/if}
								{/each}

								{#if practiceSimplification.insideProduct > 1}
									<span class="practice-radical practice-radical--single">
										<span class="practice-radical__glyph" aria-hidden="true">
											<svg viewBox="0 0 26 44" focusable="false">
												<path
													d="M2 24 L8 40 L16 6 L24 6"
													fill="none"
													stroke="currentColor"
													stroke-width="3.2"
													stroke-linecap="round"
													stroke-linejoin="round"
												/>
											</svg>
										</span>
										<span class="practice-radical__body practice-radical__body--single">
											<input
												type="number"
												min="1"
												step="1"
												use:autofocusWhenEnabled={practiceSplitStepComplete && !practiceSimplifiedStepComplete && practiceSimplifiedOutsideInputs.length === 0}
												value={practiceSimplifiedInsideInput}
												disabled={!practiceSplitStepComplete || practiceSimplifiedStepComplete}
												aria-label="Inside factor"
												oninput={(event) => {
													practiceSimplifiedInsideInput = (
														event.currentTarget as HTMLInputElement
													).value;
												}}
												class="practice-expression__input"
											/>
										</span>
									</span>
								{/if}
							</div>
							<button
								type="submit"
								class="rounded-md border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary transition-colors hover:bg-primary/18 disabled:cursor-not-allowed disabled:opacity-45"
								disabled={!practiceSplitStepComplete || practiceSimplifiedStepComplete}
							>
								Check step 6
							</button>
						</form>
						{#if practiceSimplifiedFeedback}
							<p
								class={`mt-3 rounded-lg border px-3 py-2 text-xs ${
									practiceSimplifiedFeedback.kind === 'ok'
										? 'border-emerald-300/70 bg-emerald-100/65 text-emerald-900'
										: 'border-rose-300/70 bg-rose-100/70 text-rose-900'
								}`}
							>
								{practiceSimplifiedFeedback.message}
							</p>
						{/if}
					</section>

					<section
						class={`rounded-xl border border-primary/30 bg-primary/8 p-3 transition-opacity ${
							practiceSimplifiedStepComplete ? 'opacity-100' : 'opacity-55'
						}`}
					>
						<p class="text-xs font-semibold uppercase tracking-wide text-primary">
							7. Final simplified radical
						</p>
						<form class="mt-3 space-y-3" onsubmit={submitPracticeFinalAnswer}>
							<div class="practice-expression" aria-label="Final simplified radical">
								<span class="practice-radical practice-radical--single">
									<span class="practice-radical__glyph" aria-hidden="true">
										<svg viewBox="0 0 26 44" focusable="false">
											<path
												d="M2 24 L8 40 L16 6 L24 6"
												fill="none"
												stroke="currentColor"
												stroke-width="3.2"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
										</svg>
									</span>
									<span class="practice-radical__body practice-radical__body--single">
										<span class="practice-expression__value">{practiceTree.value}</span>
									</span>
								</span>
								<span class="practice-expression__equals" aria-hidden="true">=</span>
								<input
									type="number"
									min="1"
									step="1"
									use:autofocusWhenEnabled={practiceSimplifiedStepComplete && !practiceFinalStepComplete}
									value={practiceFinalOutsideInput}
									disabled={!practiceSimplifiedStepComplete || practiceFinalStepComplete}
									aria-label="Final outside coefficient"
									oninput={(event) => {
										practiceFinalOutsideInput = (event.currentTarget as HTMLInputElement).value;
									}}
									class="practice-expression__input"
								/>
								{#if practiceSimplification.insideProduct > 1}
									<span class="practice-radical practice-radical--single">
										<span class="practice-radical__glyph" aria-hidden="true">
											<svg viewBox="0 0 26 44" focusable="false">
												<path
													d="M2 24 L8 40 L16 6 L24 6"
													fill="none"
													stroke="currentColor"
													stroke-width="3.2"
													stroke-linecap="round"
													stroke-linejoin="round"
												/>
											</svg>
										</span>
										<span class="practice-radical__body practice-radical__body--single">
											<input
												type="number"
												min="1"
												step="1"
												value={practiceFinalInsideInput}
												disabled={!practiceSimplifiedStepComplete || practiceFinalStepComplete}
												aria-label="Final inside factor"
												oninput={(event) => {
													practiceFinalInsideInput = (event.currentTarget as HTMLInputElement).value;
												}}
												class="practice-expression__input"
											/>
										</span>
									</span>
								{/if}
							</div>
							<button
								type="submit"
								class="rounded-md border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary transition-colors hover:bg-primary/18 disabled:cursor-not-allowed disabled:opacity-45"
								disabled={!practiceSimplifiedStepComplete || practiceFinalStepComplete}
							>
								Check final answer
							</button>
						</form>
						{#if practiceFinalFeedback}
							<p
								class={`mt-3 rounded-lg border px-3 py-2 text-xs ${
									practiceFinalFeedback.kind === 'ok'
										? 'border-emerald-300/70 bg-emerald-100/65 text-emerald-900'
										: 'border-rose-300/70 bg-rose-100/70 text-rose-900'
								}`}
							>
								{practiceFinalFeedback.message}
							</p>
						{/if}

						{#if practiceFinalStepComplete}
							<MathExpression
								math={practiceSimplification.finalEquation}
								displayMode
								class="mt-3 text-base text-foreground"
							/>
						{/if}
					</section>
				</div>

				{#if practiceFinalStepComplete}
					<section class="rounded-xl border border-border/70 bg-background/75 p-3">
						<p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Worked check</p>
						<div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
							<div class="rounded-lg border border-border/70 bg-background/85 p-3">
								<p class="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
									Under one radical
								</p>
								<MathExpression
									math={practiceSimplification.underSingleRadical}
									displayMode
									class="mt-2 text-sm text-foreground"
								/>
							</div>
							<div class="rounded-lg border border-border/70 bg-background/85 p-3">
								<p class="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
									Grouped pairs
								</p>
								<MathExpression
									math={practiceSimplification.groupedPairsUnderRadical}
									displayMode
									class="mt-2 text-sm text-foreground"
								/>
							</div>
							<div class="rounded-lg border border-border/70 bg-background/85 p-3">
								<p class="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
									Final answer
								</p>
								<MathExpression
									math={practiceSimplification.finalEquation}
									displayMode
									class="mt-2 text-sm text-foreground"
								/>
							</div>
						</div>
					</section>
				{/if}
			{/if}
		</div>
	{/if}
</div>

<style>
	.practice-expression {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 0.35rem 0.45rem;
	}

	.practice-expression__dot,
	.practice-expression__equals,
	.practice-expression__paren {
		padding-bottom: 0.2rem;
		font-size: 1.15rem;
		line-height: 1;
		color: rgb(71 85 105);
	}

	.practice-expression__value {
		min-width: 2rem;
		padding: 0 0.15rem 0.12rem;
		font-size: 1.08rem;
		font-weight: 600;
		line-height: 1;
		text-align: center;
		color: rgb(15 23 42);
	}

	.practice-expression__group {
		display: inline-flex;
		align-items: flex-end;
		gap: 0.2rem;
	}

	.practice-radical {
		display: inline-flex;
		align-items: flex-end;
		gap: 0;
	}

	.practice-radical__glyph {
		display: flex;
		width: 1.35rem;
		height: 2.55rem;
		flex: none;
		align-items: stretch;
		justify-content: center;
		margin-right: -0.14rem;
		color: rgb(15 23 42);
	}

	.practice-radical__glyph svg {
		display: block;
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	.practice-radical__body {
		display: inline-flex;
		min-height: 2.2rem;
		align-items: flex-end;
		gap: 0.3rem;
		border-top: 2.5px solid rgba(15, 23, 42, 0.8);
		padding: 0.08rem 0.05rem 0 0.16rem;
		margin-bottom: 0.08rem;
	}

	.practice-radical__body--single {
		padding-right: 0.08rem;
	}

	.practice-expression__input {
		width: 2.65rem;
		min-width: 2.65rem;
		height: 1.85rem;
		border: 0;
		border-bottom: 1.75px solid rgba(100, 116, 139, 0.72);
		border-radius: 0;
		background: transparent;
		padding: 0 0.12rem 0.02rem;
		font-size: 1.08rem;
		font-weight: 500;
		line-height: 1;
		text-align: center;
		color: rgb(15 23 42);
		outline: none;
		box-shadow: none;
	}

	.practice-expression__input:focus-visible {
		border-bottom-color: rgba(2, 132, 199, 0.95);
	}

	.practice-expression__input:disabled {
		cursor: default;
		border-bottom-color: rgba(148, 163, 184, 0.55);
		color: rgba(15, 23, 42, 0.72);
	}

	:global(.simplifying-radicals-walkthrough-tool input[type='number']) {
		appearance: textfield;
		-moz-appearance: textfield;
	}

	:global(.simplifying-radicals-walkthrough-tool input[type='number']::-webkit-outer-spin-button),
	:global(.simplifying-radicals-walkthrough-tool input[type='number']::-webkit-inner-spin-button) {
		-webkit-appearance: none;
		margin: 0;
	}
</style>
