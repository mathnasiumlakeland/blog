import type { Component } from 'svelte';

export type ToolComponentLoader = () => Promise<{ default: Component }>;

const interactiveToolLoaders: Record<string, ToolComponentLoader> = {
	'hexagon-minus-three-circles': () => import('./hexagon-three-circles-visual.svelte'),
	'hexagon-triangle-decomposition': () => import('./hexagon-triangle-area-visual.svelte'),
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
	'reflection-over-a-horizontal-line': () => import('./reflection-over-horizontal-line-visual.svelte'),
	'reflection-over-a-vertical-line': () => import('./reflection-over-vertical-line-visual.svelte'),
	'reflection-over-y-equals-mx-plus-b-steps': () =>
		import('./reflection-over-y-equals-mx-plus-b-steps-visual.svelte'),
	'reflection-over-y-equals-x': () => import('./reflection-over-y-equals-x-visual.svelte'),
	'reflection-over-y-equals-x-plus-b': () =>
		import('./reflection-over-y-equals-x-plus-b-visual.svelte'),
	'scientific-calculator': () => import('./scientific-calculator.svelte'),
	'sector-fraction-area': () => import('./sector-fraction-visual.svelte')
};

export function getInteractiveToolLoaderById(id: string) {
	return interactiveToolLoaders[id];
}

export async function loadInteractiveToolComponentById(id: string): Promise<Component | null> {
	const loader = getInteractiveToolLoaderById(id);
	if (!loader) {
		return null;
	}
	const module = await loader();
	return module.default;
}
