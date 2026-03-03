import type { Component } from 'svelte';

export type ToolComponentLoader = () => Promise<{ default: Component }>;
type ToolComponentSourceMap = Record<string, string>;

const interactiveToolComponentSources: ToolComponentSourceMap = {
	'hexagon-minus-three-circles': 'hexagon-three-circles-visual.svelte',
	'regular-polygon-triangle-decomposition': 'hexagon-triangle-area-visual.svelte',
	'lattice-paths-explorer': 'lattice-paths-visual.svelte',
	'lissajous-pattern-lab': 'lissajous-canvas.svelte',
	'simple-interest-growth': 'simple-interest-growth-visual.svelte',
	'compound-interest-growth': 'compound-interest-growth-visual.svelte',
	'continuous-compounding-growth': 'continuous-compounding-growth-visual.svelte',
	'compound-interest-convergence-to-e': 'compound-interest-convergence-to-e-visual.svelte',
	'pascal-triangle-modulo-explorer': 'pascal-modulo-canvas.svelte',
	'polygon-sum-of-interior-angles': 'polygon-triangulation-visual.svelte',
	'regular-interior-angle': 'regular-interior-angle-visual.svelte',
	'unit-circle-pythagorean-identity': 'unit-circle-pythagorean-identity-visual.svelte',
	'reflection-over-a-horizontal-line': 'reflection-over-horizontal-line-visual.svelte',
	'reflection-over-a-vertical-line': 'reflection-over-vertical-line-visual.svelte',
	'reflection-over-y-equals-mx-plus-b-steps': 'reflection-over-y-equals-mx-plus-b-steps-visual.svelte',
	'reflection-over-y-equals-x': 'reflection-over-y-equals-x-visual.svelte',
	'reflection-over-y-equals-x-plus-b': 'reflection-over-y-equals-x-plus-b-visual.svelte',
	'reflection-over-y-equals-x-plus-b-three-step-shift':
		'reflection-over-y-equals-x-plus-b-three-step-shift-visual.svelte',
	'projectile-trajectory': 'projectile-trajectory-visual.svelte',
	'velocity-components': 'velocity-components-visual.svelte',
	'projectile-range-vs-angle': 'projectile-range-vs-angle-visual.svelte',
	'polyhedron-surface-area': 'rectangular-prism-surface-area-net-visual.svelte',
	'scientific-calculator': 'scientific-calculator.svelte',
	'sector-fraction-area': 'sector-fraction-visual.svelte',
	'stick-figure-tree-shadow-proportion': 'stick-figure-tree-shadow-proportion-visual.svelte'
};

const interactiveToolLoaders: Record<string, ToolComponentLoader> = {
	'hexagon-minus-three-circles': () => import('./hexagon-three-circles-visual.svelte'),
	'regular-polygon-triangle-decomposition': () => import('./hexagon-triangle-area-visual.svelte'),
	'lattice-paths-explorer': () => import('./lattice-paths-visual.svelte'),
	'lissajous-pattern-lab': () => import('./lissajous-canvas.svelte'),
	'simple-interest-growth': () => import('./simple-interest-growth-visual.svelte'),
	'compound-interest-growth': () => import('./compound-interest-growth-visual.svelte'),
	'continuous-compounding-growth': () => import('./continuous-compounding-growth-visual.svelte'),
	'compound-interest-convergence-to-e': () =>
		import('./compound-interest-convergence-to-e-visual.svelte'),
	'pascal-triangle-modulo-explorer': () => import('./pascal-modulo-canvas.svelte'),
	'polygon-sum-of-interior-angles': () => import('./polygon-triangulation-visual.svelte'),
	'regular-interior-angle': () => import('./regular-interior-angle-visual.svelte'),
	'unit-circle-pythagorean-identity': () =>
		import('./unit-circle-pythagorean-identity-visual.svelte'),
	'reflection-over-a-horizontal-line': () => import('./reflection-over-horizontal-line-visual.svelte'),
	'reflection-over-a-vertical-line': () => import('./reflection-over-vertical-line-visual.svelte'),
	'reflection-over-y-equals-mx-plus-b-steps': () =>
		import('./reflection-over-y-equals-mx-plus-b-steps-visual.svelte'),
	'reflection-over-y-equals-x': () => import('./reflection-over-y-equals-x-visual.svelte'),
	'reflection-over-y-equals-x-plus-b': () =>
		import('./reflection-over-y-equals-x-plus-b-visual.svelte'),
	'reflection-over-y-equals-x-plus-b-three-step-shift': () =>
		import('./reflection-over-y-equals-x-plus-b-three-step-shift-visual.svelte'),
	'projectile-trajectory': () => import('./projectile-trajectory-visual.svelte'),
	'velocity-components': () => import('./velocity-components-visual.svelte'),
	'projectile-range-vs-angle': () => import('./projectile-range-vs-angle-visual.svelte'),
	'polyhedron-surface-area': () =>
		import('./rectangular-prism-surface-area-net-visual.svelte'),
	'scientific-calculator': () => import('./scientific-calculator.svelte'),
	'sector-fraction-area': () => import('./sector-fraction-visual.svelte'),
	'stick-figure-tree-shadow-proportion': () =>
		import('./stick-figure-tree-shadow-proportion-visual.svelte')
};

export function getInteractiveToolLoaderById(id: string) {
	return interactiveToolLoaders[id];
}

export function getInteractiveToolComponentSourceById(id: string) {
	return interactiveToolComponentSources[id];
}

export async function loadInteractiveToolComponentById(id: string): Promise<Component | null> {
	const loader = getInteractiveToolLoaderById(id);
	if (!loader) {
		return null;
	}
	const module = await loader();
	return module.default;
}
