export type MathToolMeta = {
	id: string;
	title: string;
	description: string;
	inputs: string;
	outputs: string;
	useCase: string;
	tags: string[];
	audience: string[];
	kind: 'interactive' | 'helper';
};

export type ToolListEntry = {
	id: string;
	meta: MathToolMeta;
};
