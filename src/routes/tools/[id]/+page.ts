import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageLoad } from './$types';
import { getInteractiveToolLoaderById } from '$lib/components/math/tool-component-map';
import { getInteractiveToolById, getInteractiveToolIds } from '$lib/components/math/tool-registry';

export const prerender = true;

export const entries: EntryGenerator = () => {
	return getInteractiveToolIds().map((id) => ({ id }));
};

export const load: PageLoad = ({ params }) => {
	const toolMeta = getInteractiveToolById(params.id);
	const loader = getInteractiveToolLoaderById(params.id);

	if (!toolMeta || !loader) {
		throw error(404, 'Tool not found');
	}

	return { id: params.id };
};
