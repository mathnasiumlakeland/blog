import type { Component } from 'svelte';

export type ToolComponentLoader = () => Promise<{ default: Component }>;

const interactiveToolLoaders: Record<string, ToolComponentLoader> = {
	'hexagon-three-circles-visual': () => import('./hexagon-three-circles-visual.svelte'),
	'hexagon-triangle-area-visual': () => import('./hexagon-triangle-area-visual.svelte'),
	'lattice-paths-visual': () => import('./lattice-paths-visual.svelte'),
	'lissajous-canvas': () => import('./lissajous-canvas.svelte'),
	'pascal-modulo-canvas': () => import('./pascal-modulo-canvas.svelte'),
	'polygon-triangulation-visual': () => import('./polygon-triangulation-visual.svelte'),
	'regular-interior-angle-visual': () => import('./regular-interior-angle-visual.svelte'),
	'scientific-calculator': () => import('./scientific-calculator.svelte'),
	'sector-fraction-visual': () => import('./sector-fraction-visual.svelte')
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
