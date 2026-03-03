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
		id: 'regular-polygon-triangle-decomposition',
		meta: {
			id: 'regular-polygon-triangle-decomposition',
			title: 'Regular Polygon Triangle Decomposition',
			description:
				'Decompose a regular polygon into center triangles to compute area by summing triangle areas.',
			inputs: 'Number of sides n (5 to 8) and side length s.',
			outputs:
				'Apothem, one-triangle area, and total polygon area with a live decomposition diagram.',
			useCase: 'Use for geometry instruction on regular-polygon area formulas and decomposition.',
			tags: ['geometry', 'area', 'polygons', 'triangles', 'decomposition']
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
		id: 'combinatorics-formula-lab',
		meta: {
			id: 'combinatorics-formula-lab',
			title: 'Combinatorics Formula Lab',
			description:
				'Compare permutation and combination formulas with slot visuals and overcount corrections.',
			inputs: 'Distinct values n, slots r, and repeated-count m controls.',
			outputs: 'Live counts for n^r, nPr, nCr, and n!/m! with visual counting steps.',
			useCase: 'Use for introducing why different combinatorics formulas multiply or divide.',
			tags: ['combinatorics', 'permutations', 'combinations', 'counting', 'factorials']
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
			description: 'Plot $A = P(1 + rt)$ over time with adjustable principal, rate, and years.',
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
			description: 'Plot $A = P(1 + r/n)^{nt}$ with adjustable compounding frequency $n$.',
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
			description: 'Plot $A = Pe^{rt}$ with interactive principal, rate, and time controls.',
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
				"Plot $A_n = (1 + 1/n)^n$ to see how increasing $n$ converges toward Euler's number $e$.",
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
			description: 'Draw diagonals from one vertex to show why a polygon splits into $n - 2$ triangles.',
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
		id: 'unit-circle-pythagorean-identity',
		meta: {
			id: 'unit-circle-pythagorean-identity',
			title: 'Unit Circle Pythagorean Identity',
			description:
				'Drag a point around the unit circle to connect coordinates with trig values and verify $\\sin^2\\theta + \\cos^2\\theta = 1$',
			inputs: 'Drag the point around the circumference to change angle θ and coordinate values.',
			outputs: 'Live point (x, y), x/y right-triangle legs, and the identity check x² + y² = 1.',
			useCase:
				'Use for introducing unit-circle coordinates and deriving the Pythagorean trig identity.',
			tags: ['trigonometry', 'unit-circle', 'identities', 'geometry']
		}
	},
	{
		id: 'unit-circle-reference',
		meta: {
			id: 'unit-circle-reference',
			title: 'Unit Circle Reference',
			description:
				'Explore the key unit-circle angles with exact coordinate pairs to connect x = cos θ and y = sin θ.',
			inputs: 'Tap a highlighted special-angle point around the unit circle.',
			outputs:
				'Exact degree/radian angle, coordinate pair (cos θ, sin θ), and highlighted spoke/angle cue.',
			useCase:
				'Use for memorizing special angles and reading cosine/sine values directly from the unit circle.',
			tags: ['trigonometry', 'unit-circle', 'special-angles', 'sine', 'cosine']
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
				'Walk through translate, rotate, reflect, rotate-back, and translate-back for $y = mx + b$.',
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
				'Move a point and reflect it across the diagonal line $y = x$ on a coordinate grid.',
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
				'Move a shifted diagonal mirror line and point to see reflection updates in real time for $y = x + b$.',
			inputs: 'Point coordinates x and y plus shift b for the mirror line y = x + b.',
			outputs:
				'Live coordinates for P and P′, midpoint on the mirror line, and matching |dx|/|dy| helper distances.',
			useCase:
				'Use for coordinate-geometry reflections when the mirror is a translated diagonal line.',
			tags: ['geometry', 'transformations', 'reflection', 'coordinates']
		}
	},
	{
		id: 'reflection-over-y-equals-x-plus-b-three-step-shift',
		meta: {
			id: 'reflection-over-y-equals-x-plus-b-three-step-shift',
			title: 'Reflection Over y = x + b Three-Step Shift',
			description:
				'Walk through the shortcut for $y = x + b$: subtract $b$, flip across $y = x$, then add $b$ back.',
			inputs: 'Point coordinates x and y, shift b, and step focus buttons.',
			outputs: 'Intermediate points P1 and P2, plus final reflected point P′ with step equations.',
			useCase: 'Use for teaching the translate-flip-translate method for shifted diagonal reflections.',
			tags: ['geometry', 'transformations', 'reflection', 'coordinates', 'step-by-step']
		}
	},
	{
		id: 'projectile-trajectory',
		meta: {
			id: 'projectile-trajectory',
			title: 'Projectile Trajectory',
			description:
				'Plot the parabolic arc of a projectile with adjustable launch speed and angle.',
			inputs: 'Initial speed v₀ (m/s) and launch angle θ (degrees).',
			outputs: 'Parabolic trajectory plot, time of flight T, maximum height H, and range R.',
			useCase: 'Use for ballistic kinematics lessons on the equations of motion and projectile arcs.',
			tags: ['kinematics', 'physics', 'quadratics', 'trigonometry', 'geometry']
		}
	},
	{
		id: 'velocity-components',
		meta: {
			id: 'velocity-components',
			title: 'Velocity Components',
			description:
				'Decompose an initial velocity vector into horizontal and vertical components using trigonometry.',
			inputs: 'Launch angle θ from 5° to 85°.',
			outputs: 'Visual vector triangle with vₓ = v₀ cos θ and vy = v₀ sin θ labeled.',
			useCase:
				'Use for connecting trigonometric decomposition to real-world projectile motion set-up.',
			tags: ['kinematics', 'trigonometry', 'vectors', 'physics', 'geometry']
		}
	},
	{
		id: 'projectile-range-vs-angle',
		meta: {
			id: 'projectile-range-vs-angle',
			title: 'Projectile Range vs Angle',
			description:
				'Plot horizontal range as a function of launch angle and find the 45° optimum.',
			inputs: 'Initial speed v₀ and selected launch angle θ.',
			outputs: 'Range curve R(θ), peak at 45°, and equal-range complementary angle pair.',
			useCase:
				'Use for optimization and symmetry discussions in projectile motion.',
			tags: ['kinematics', 'optimization', 'trigonometry', 'physics', 'functions']
		}
	},
	{
		id: 'polyhedron-surface-area',
		meta: {
			id: 'polyhedron-surface-area',
			title: '3D Solids Surface Area',
			description:
				'Explore multiple 3D solids, compare each face with its net, and build total surface area as a sum.',
			inputs:
				'Shape selector, shape dimensions, draggable 3D model, and clickable net faces.',
			outputs:
				'Face-by-face formulas, synchronized face highlighting, and total surface area expressions.',
			useCase:
				'Use for geometry lessons connecting 3D solids, 2D nets, and additive surface-area reasoning.',
			tags: ['geometry', 'surface-area', 'nets', '3d-solids', 'measurement']
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
	},
	{
		id: 'stick-figure-tree-shadow-proportion',
		meta: {
			id: 'stick-figure-tree-shadow-proportion',
			title: 'Stick Figure Tree Shadow Proportion',
			description:
				'Compare a stick figure and tree shadow to solve unknown height with equivalent fractions.',
			inputs: 'Stick figure height and shadow length, plus tree shadow length.',
			outputs:
				'Live scene, equivalent height-to-shadow fractions, and solved tree height from the proportion.',
			useCase:
				'Use for teaching proportional reasoning with similar triangles in everyday shadow problems.',
			tags: ['proportional-reasoning', 'ratios', 'proportions', 'similar-triangles', 'word-problems']
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
