import type { Component } from 'svelte';

export type ToolComponentLoader = () => Promise<{ default: Component }>;

const interactiveToolLoaders: Record<string, ToolComponentLoader> = {
	'hexagon-minus-three-circles': () => import('./hexagon-three-circles-visual.svelte'),
	'hexagon-triangle-decomposition': () => import('./hexagon-triangle-area-visual.svelte'),
	'lattice-paths-explorer': () => import('./lattice-paths-visual.svelte'),
	'lissajous-pattern-lab': () => import('./lissajous-canvas.svelte'),
	'pascal-triangle-modulo-explorer': () => import('./pascal-modulo-canvas.svelte'),
	'polygon-sum-of-interior-angles': () => import('./polygon-triangulation-visual.svelte'),
	'regular-interior-angle': () => import('./regular-interior-angle-visual.svelte'),
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
