import type { MathToolMeta, ToolListEntry } from './tool-meta';

export const interactiveMathTools: ToolListEntry[] = [
	{
		id: 'hexagon-minus-three-circles',
		meta: {
			id: 'hexagon-minus-three-circles',
			title: 'Hexagon Minus Three Circles',
			description: 'Show a regular hexagon with three unit circles removed to visualize a target area.',
			inputs: 'Hexagon radius n controlled by a slider; tangent highlight updates automatically.',
			outputs: 'Hexagon area, center distance, target area, and tangent/non-tangent visual status.',
			useCase: 'Use for geometry lessons on composite area and tangent-circle constraints.',
			tags: ['geometry', 'area', 'circles', 'hexagon', 'tangent']
		}
	},
	{
		id: 'hexagon-triangle-decomposition',
		meta: {
			id: 'hexagon-triangle-decomposition',
			title: 'Hexagon Triangle Decomposition',
			description: 'Break a regular hexagon into six equilateral triangles and track area values.',
			inputs: 'Hexagon side/radius n selected by slider.',
			outputs: 'Triangle height, one-triangle area, and full hexagon area with live diagram updates.',
			useCase: 'Use for geometry instruction on decomposition and area formulas.',
			tags: ['geometry', 'area', 'hexagon', 'triangles', 'decomposition']
		}
	},
	{
		id: 'lattice-paths-explorer',
		meta: {
			id: 'lattice-paths-explorer',
			title: 'Lattice Paths Explorer',
			description:
				'Build and animate grid paths to compare Manhattan distance, Euclidean distance, and path counts.',
			inputs: 'Square size n, optional general grid values m and n, and manual/auto path controls.',
			outputs: 'Live path visualizations plus combinatorial counts shown with binomial expressions.',
			useCase: 'Use for counting, combinatorics, coordinate geometry, and strategy discussions.',
			tags: ['combinatorics', 'geometry', 'counting', 'binomial', 'lattice-paths']
		}
	},
	{
		id: 'lissajous-pattern-lab',
		meta: {
			id: 'lissajous-pattern-lab',
			title: 'Lissajous Pattern Lab',
			description: 'Animate Lissajous curves to connect frequency ratios with visible symmetry.',
			inputs: 'Frequency A, frequency B, phase, speed, and play/pause state.',
			outputs:
				'A continuously drawn curve that changes shape as trigonometric parameters change.',
			useCase:
				'Use for algebra and trigonometry discussions on periodic functions and parameter effects.',
			tags: ['algebra', 'trigonometry', 'patterns', 'animation', 'functions']
		}
	},
	{
		id: 'simple-interest-growth',
		meta: {
			id: 'simple-interest-growth',
			title: 'Simple Interest Growth',
			description: 'Plot A = P(1 + rt) over time with adjustable principal, rate, and years.',
			inputs: 'Principal P, annual rate r, graph horizon in years, and selected year marker.',
			outputs: 'Linear growth curve, selected amount A(t), and total interest A(t) - P.',
			useCase: 'Use for understanding linear growth and the basic simple-interest formula.',
			tags: ['interest', 'finance', 'algebra', 'linear-growth']
		}
	},
	{
		id: 'compound-interest-growth',
		meta: {
			id: 'compound-interest-growth',
			title: 'Compound Interest Growth',
			description: 'Plot A = P(1 + r/n)^{nt} with adjustable compounding frequency n.',
			inputs: 'Principal P, annual rate r, compounds per year n, years, and selected year marker.',
			outputs: 'Exponential growth curve, per-period rate r/n, selected amount A(t), and interest earned.',
			useCase: 'Use for comparing compounding schedules and understanding discrete exponential growth.',
			tags: ['interest', 'finance', 'algebra', 'exponential-growth', 'compound-interest']
		}
	},
	{
		id: 'continuous-compounding-growth',
		meta: {
			id: 'continuous-compounding-growth',
			title: 'Continuous Compounding Growth',
			description: 'Plot A = Pe^{rt} with interactive principal, rate, and time controls.',
			inputs: 'Principal P, annual rate r, graph horizon in years, and selected year marker.',
			outputs: 'Continuous exponential curve, selected amount A(t), and total interest A(t) - P.',
			useCase: 'Use for lessons on Euler-based growth and continuous compounding behavior.',
			tags: ['interest', 'finance', 'algebra', 'e', 'continuous-compounding']
		}
	},
	{
		id: 'compound-interest-convergence-to-e',
		meta: {
			id: 'compound-interest-convergence-to-e',
			title: 'Compound Interest Convergence to e',
			description:
				"Plot A_n = (1 + 1/n)^n to see how increasing n converges toward Euler's number e.",
			inputs: 'Maximum n shown on the x-axis and a selected n marker.',
			outputs: 'Curve values A_n, selected approximation, and the distance between A_n and e.',
			useCase: 'Use for lessons on compound-interest limits and continuous compounding intuition.',
			tags: ['interest', 'sequences', 'limits', 'compound-interest', 'e']
		}
	},
	{
		id: 'pascal-triangle-modulo-explorer',
		meta: {
			id: 'pascal-triangle-modulo-explorer',
			title: 'Pascal Triangle Modulo Explorer',
			description:
				'Explore Pascal triangle coefficients modulo k with a live plot and a selectable coefficient inspector.',
			inputs: 'Row count, modulo base, dot size, zero-remainder toggle, and selected row/column.',
			outputs: 'Color-coded modulo plot plus exact binomial value and remainder for the selected entry.',
			useCase: 'Use for modular arithmetic, binomial coefficients, and visual pattern recognition.',
			tags: ['number-theory', 'modular-arithmetic', 'patterns', 'binomial']
		}
	},
	{
		id: 'polygon-sum-of-interior-angles',
		meta: {
			id: 'polygon-sum-of-interior-angles',
			title: 'Polygon Sum of Interior Angles',
			description: 'Draw diagonals from one vertex to show why a polygon splits into n - 2 triangles.',
			inputs: 'Number of polygon sides n.',
			outputs: 'Triangulated polygon view plus triangle-count and interior-sum formulas.',
			useCase: 'Use for geometric proofs and interior-angle sum reasoning.',
			tags: ['geometry', 'proof', 'triangulation', 'polygons', 'angle-sum']
		}
	},
	{
		id: 'regular-interior-angle',
		meta: {
			id: 'regular-interior-angle',
			title: 'Regular Interior Angle',
			description:
				'Show how each interior angle changes as the number of regular-polygon sides changes.',
			inputs: 'Number of sides n.',
			outputs: 'Total interior-angle sum and one interior angle with highlighted angle arc.',
			useCase: 'Use for polygon-angle lessons and formula-to-figure connections.',
			tags: ['geometry', 'angles', 'polygons', 'regular-polygons', 'formula']
		}
	},
	{
		id: 'reflection-over-a-horizontal-line',
		meta: {
			id: 'reflection-over-a-horizontal-line',
			title: 'Reflection Over a Horizontal Line',
			description:
				'Move a horizontal line and a point to see the reflected point update on a coordinate grid.',
			inputs: 'Reflection line height k plus point coordinates x and y anywhere in the visible window.',
			outputs:
				'Live coordinates for P and P′, vertical distance to the line, and a mirrored graph in [-10, 10].',
			useCase: 'Use for coordinate-geometry reflection practice and transformation intuition.',
			tags: ['geometry', 'transformations', 'reflection', 'coordinates']
		}
	},
	{
		id: 'reflection-over-a-vertical-line',
		meta: {
			id: 'reflection-over-a-vertical-line',
			title: 'Reflection Over a Vertical Line',
			description:
				'Move a vertical line and a point to see the reflected point update on a coordinate grid.',
			inputs: 'Reflection line position k plus point coordinates x and y in the visible window.',
			outputs:
				'Live coordinates for P and P′, horizontal distance to the line, and a mirrored graph in [-10, 10].',
			useCase: 'Use for coordinate-geometry reflection practice and transformation intuition.',
			tags: ['geometry', 'transformations', 'reflection', 'coordinates']
		}
	},
	{
		id: 'reflection-over-y-equals-mx-plus-b-steps',
		meta: {
			id: 'reflection-over-y-equals-mx-plus-b-steps',
			title: 'Reflection Over y = mx + b Steps',
			description:
				'Walk through translate, rotate, reflect, rotate-back, and translate-back for y = mx + b.',
			inputs: 'Slope m, intercept b, and draggable point P before the sequence starts.',
			outputs:
				'Step-by-step transformed line/point states, angle θ cue, and final reflected coordinates P′.',
			useCase:
				'Use for deriving and teaching the full reflection procedure for generic non-vertical lines.',
			tags: ['geometry', 'transformations', 'reflection', 'derivation', 'coordinates']
		}
	},
	{
		id: 'reflection-over-y-equals-x',
		meta: {
			id: 'reflection-over-y-equals-x',
			title: 'Reflection Over y = x',
			description:
				'Move a point and reflect it across the diagonal line y = x on a coordinate grid.',
			inputs: 'Point coordinates x and y anywhere in the visible window.',
			outputs:
				'Live coordinates for P and P′, midpoint on y = x, and equal-distance segments to the mirror line.',
			useCase: 'Use for coordinate-geometry reflections and understanding the coordinate-swap rule.',
			tags: ['geometry', 'transformations', 'reflection', 'coordinates']
		}
	},
	{
		id: 'reflection-over-y-equals-x-plus-b',
		meta: {
			id: 'reflection-over-y-equals-x-plus-b',
			title: 'Reflection Over y = x + b',
			description:
				'Move a shifted diagonal mirror line and point to see reflection updates in real time.',
			inputs: 'Point coordinates x and y plus shift b for the mirror line y = x + b.',
			outputs:
				'Live coordinates for P and P′, midpoint on the mirror line, and matching |dx|/|dy| helper distances.',
			useCase:
				'Use for coordinate-geometry reflections when the mirror is a translated diagonal line.',
			tags: ['geometry', 'transformations', 'reflection', 'coordinates']
		}
	},
	{
		id: 'scientific-calculator',
		meta: {
			id: 'scientific-calculator',
			title: 'Scientific Calculator',
			description:
				'Enter algebraic and trigonometric expressions with live math rendering, instant evaluation, and history.',
			inputs:
				'Keyboard or keypad expressions with operators, parentheses, trig/log functions, roots, constants, and Ans.',
			outputs:
				'Live rendered math expression, right-aligned running result, and a short recent-results history.',
			useCase:
				'Use for arithmetic fluency, function practice, and quick verification during instruction or homework.',
			tags: ['algebra', 'trigonometry', 'calculator', 'functions', 'evaluation']
		}
	},
	{
		id: 'sector-fraction-area',
		meta: {
			id: 'sector-fraction-area',
			title: 'Sector Fraction Area',
			description:
				'Connect angle measure to area by shading a circle sector and scaling equal sectors.',
			inputs: 'Central angle theta in degrees and number of equal sectors.',
			outputs: 'Single-sector area and scaled total area with a live sector diagram.',
			useCase: 'Use for circle geometry, fraction reasoning, and area proportionality.',
			tags: ['geometry', 'circles', 'fractions', 'area', 'angles']
		}
	}
];

export function getInteractiveToolIds() {
	return interactiveMathTools.map((entry) => entry.id);
}

export function getInteractiveToolById(id: string) {
	return interactiveMathTools.find((entry) => entry.id === id);
}

export function requireInteractiveToolMetaById(id: string): MathToolMeta {
	const entry = getInteractiveToolById(id);
	if (!entry) {
		throw new Error(`Unknown interactive tool id: ${id}`);
	}
	return entry.meta;
}
