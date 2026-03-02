<script module lang="ts">
	import type { MathToolMeta } from './tool-meta';
	import { requireInteractiveToolMetaById } from './tool-registry';

	export const toolMeta: MathToolMeta = requireInteractiveToolMetaById(
		'regular-polygon-triangle-decomposition'
	);
</script>

<script lang="ts">
	import MathExpression from '$lib/components/math/math-expression.svelte';
	import { TOOL_BG_GRADIENT_END, TOOL_BG_GRADIENT_START } from './tool-visual-theme';

	type Point = { x: number; y: number };

	const width = 620;
	const height = 380;
	const polygonNames: Record<number, string> = {
		5: 'pentagon',
		6: 'hexagon',
		7: 'heptagon',
		8: 'octagon'
	};

	let sides = $state(6);
	let sideLength = $state(1.8);

	const centralAngle = $derived(360 / sides);
	const apothem = $derived(sideLength / (2 * Math.tan(Math.PI / sides)));
	const oneTriangleArea = $derived((sideLength * apothem) / 2);
	const polygonArea = $derived(sides * oneTriangleArea);
	const hexagonEquilateralArea = $derived(((3 * Math.sqrt(3)) / 2) * sideLength * sideLength);

	const circumradius = $derived(sideLength / (2 * Math.sin(Math.PI / sides)));
	const scale = $derived(Math.min(width, height) * 0.35 / Math.max(0.7, circumradius));
	const center = $derived({ x: width / 2, y: height / 2 + 8 });

	const vertices = $derived.by(() =>
		Array.from({ length: sides }, (_, i) => {
			const angle = -Math.PI / 2 + (i * Math.PI * 2) / sides;
			return {
				x: center.x + circumradius * scale * Math.cos(angle),
				y: center.y + circumradius * scale * Math.sin(angle)
			};
		})
	);

	const polygonPath = $derived(
		vertices.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ') + ' Z'
	);

	const trianglePaths = $derived.by(() =>
		Array.from({ length: sides }, (_, index) => {
			const left = vertices[index];
			const right = vertices[(index + 1) % sides];
			return `M ${center.x} ${center.y} L ${left.x} ${left.y} L ${right.x} ${right.y} Z`;
		})
	);

	const sampleEdgeMidpoint = $derived({
		x: (vertices[0].x + vertices[1].x) / 2,
		y: (vertices[0].y + vertices[1].y) / 2
	});

	const sideLabelPoint = $derived({
		x: (vertices[0].x + vertices[1].x) / 2 + 10,
		y: (vertices[0].y + vertices[1].y) / 2 - 10
	});
</script>

<div class="space-y-4">
	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Shape:
			<span class="ml-1 font-semibold text-foreground">
				{sides}-sided regular {polygonNames[sides]}
			</span>
		</p>
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Apothem:
			<MathExpression
				math={`a=\\frac{s}{2\\tan\\left(\\pi/${sides}\\right)}=${apothem.toFixed(3)}`}
				class="ml-1 font-semibold text-foreground"
			/>
		</p>
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			One center triangle area:
			<MathExpression
				math={`\\frac{1}{2}\\cdot${sideLength.toFixed(2)}\\cdot${apothem.toFixed(3)}=${oneTriangleArea.toFixed(3)}`}
				class="ml-1 font-semibold text-foreground"
			/>
		</p>
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Total polygon area:
			<MathExpression
				math={`${sides}\\cdot${oneTriangleArea.toFixed(3)}=${polygonArea.toFixed(3)}`}
				class="ml-1 font-semibold text-foreground"
			/>
		</p>
	</div>

	<svg
		viewBox={`0 0 ${width} ${height}`}
		class="h-auto w-full rounded-xl border border-border/70 bg-card/70 text-slate-900 dark:text-slate-100"
		role="img"
		aria-label="Regular polygon decomposed into center triangles"
		>
			<defs>
				<linearGradient id="tri-bg" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stop-color={TOOL_BG_GRADIENT_START}></stop>
					<stop offset="100%" stop-color={TOOL_BG_GRADIENT_END}></stop>
				</linearGradient>
			</defs>
		<rect x="0" y="0" width={width} height={height} fill="url(#tri-bg)"></rect>
		<path
			d={polygonPath}
			fill="rgba(255,255,255,0.62)"
			stroke="rgba(15,23,42,0.84)"
			stroke-width="2.1"
		></path>

		{#each trianglePaths as trianglePath, index (index)}
			<path
				d={trianglePath}
				fill={index % 2 === 0 ? 'rgba(59,130,246,0.17)' : 'rgba(20,184,166,0.16)'}
				stroke="rgba(15,23,42,0.2)"
				stroke-width="0.8"
			></path>
		{/each}

		{#each vertices as point, idx (idx)}
			<line
				x1={center.x}
				y1={center.y}
				x2={point.x}
				y2={point.y}
				stroke="rgba(15,23,42,0.32)"
				stroke-width="1.2"
			></line>
		{/each}

		<line
			x1={center.x}
			y1={center.y}
			x2={sampleEdgeMidpoint.x}
			y2={sampleEdgeMidpoint.y}
			stroke="rgba(217,119,6,0.94)"
			stroke-width="2"
			stroke-dasharray="5 4"
		></line>
		<circle cx={sampleEdgeMidpoint.x} cy={sampleEdgeMidpoint.y} r="3.2" fill="rgba(217,119,6,0.95)"></circle>
		<text
			x={sampleEdgeMidpoint.x + 8}
			y={sampleEdgeMidpoint.y + 2}
			font-size="13"
			fill="currentColor"
			class="text-amber-800 dark:text-amber-200"
		>
			a
		</text>
		<text
			x={sideLabelPoint.x}
			y={sideLabelPoint.y}
			font-size="13"
			fill="currentColor"
		>
			s
		</text>

		<text x="20" y="30" font-size="14" fill="currentColor">{sides} congruent triangles from the center</text>
		<text x="20" y="50" font-size="13" fill="currentColor">Each has base s, height a, and central angle {centralAngle.toFixed(1)}°</text>
	</svg>

	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			Number of sides n
			<input
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
				type="range"
				min="5"
				max="8"
				step="1"
				bind:value={sides}
			/>
		</label>
		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			Side length s
			<input
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
				type="range"
				min="1"
				max="3"
				step="0.01"
				bind:value={sideLength}
			/>
		</label>
	</div>

	<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-xs text-muted-foreground">
		General area model:
		<MathExpression
			math={`A=n\\left(\\frac{1}{2}sa\\right)=\\frac{ns^2}{4\\tan\\left(\\pi/n\\right)}=${polygonArea.toFixed(3)}`}
			class="ml-1 font-medium text-foreground"
		/>
	</p>

	{#if sides === 6}
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-xs text-muted-foreground">
			For a regular hexagon, the center triangles are equilateral, so:
			<MathExpression
				math={`A_{hex}=6\\left(\\frac{\\sqrt3}{4}s^2\\right)=\\frac{3\\sqrt3}{2}s^2=${hexagonEquilateralArea.toFixed(3)}`}
				class="ml-1 font-medium text-foreground"
			/>
		</p>
	{/if}
</div>
