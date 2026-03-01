import type { ToolListEntry } from './tool-meta';

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
			tags: ['geometry', 'area', 'circles', 'hexagon', 'tangent'],
			audience: ['students', 'instructors'],
			kind: 'interactive'
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
			tags: ['geometry', 'area', 'hexagon', 'triangles', 'decomposition'],
			audience: ['students', 'instructors'],
			kind: 'interactive'
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
			tags: ['combinatorics', 'geometry', 'counting', 'binomial', 'lattice-paths'],
			audience: ['students', 'instructors'],
			kind: 'interactive'
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
			tags: ['algebra', 'trigonometry', 'patterns', 'animation', 'functions'],
			audience: ['students', 'instructors'],
			kind: 'interactive'
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
			tags: ['number-theory', 'modular-arithmetic', 'patterns', 'pascal-triangle', 'binomial'],
			audience: ['students', 'instructors'],
			kind: 'interactive'
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
			tags: ['geometry', 'proof', 'triangulation', 'polygons', 'angle-sum'],
			audience: ['students', 'instructors'],
			kind: 'interactive'
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
			tags: ['geometry', 'angles', 'polygons', 'regular-polygons', 'formula'],
			audience: ['students', 'instructors'],
			kind: 'interactive'
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
			tags: ['algebra', 'trigonometry', 'calculator', 'functions', 'evaluation'],
			audience: ['students', 'instructors'],
			kind: 'interactive'
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
			tags: ['geometry', 'circles', 'fractions', 'area', 'angles'],
			audience: ['students', 'instructors'],
			kind: 'interactive'
		}
	}
];

export function getInteractiveToolIds() {
	return interactiveMathTools.map((entry) => entry.id);
}

export function getInteractiveToolById(id: string) {
	return interactiveMathTools.find((entry) => entry.id === id);
}
