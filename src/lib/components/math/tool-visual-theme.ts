export const TOOL_BG_GRADIENT_START = 'rgba(59,130,246,0.14)';
export const TOOL_BG_GRADIENT_END = 'rgba(20,184,166,0.1)';
export const TOOL_BG_SURFACE_WASH = 'rgba(255,255,255,0.62)';

export function fillToolCanvasBackground(
	context: CanvasRenderingContext2D,
	width: number,
	height: number
) {
	const gradient = context.createLinearGradient(0, 0, width, height);
	gradient.addColorStop(0, TOOL_BG_GRADIENT_START);
	gradient.addColorStop(1, TOOL_BG_GRADIENT_END);
	context.fillStyle = gradient;
	context.fillRect(0, 0, width, height);

	context.fillStyle = TOOL_BG_SURFACE_WASH;
	context.fillRect(0, 0, width, height);
}
