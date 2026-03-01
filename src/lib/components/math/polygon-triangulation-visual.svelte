<script module lang="ts">
	import type { MathToolMeta } from './tool-meta';

	export const toolMeta: MathToolMeta = {
		id: 'polygon-triangulation-visual',
		title: 'Polygon Sum of Interior Angles',
		description: 'Draw diagonals from one vertex to show why a polygon splits into n - 2 triangles.',
		inputs: 'Number of polygon sides n.',
		outputs: 'Triangulated polygon view plus triangle-count and interior-sum formulas.',
		useCase: 'Use for geometric proofs and interior-angle sum reasoning.',
		tags: ['geometry', 'proof', 'triangulation', 'polygons', 'angle-sum'],
		audience: ['students', 'instructors'],
		kind: 'interactive'
	};
</script>

<script lang="ts">
	import MathExpression from '$lib/components/math/math-expression.svelte';
	import { TOOL_BG_GRADIENT_END, TOOL_BG_GRADIENT_START } from './tool-visual-theme';

	type Point = { x: number; y: number };

	const width = 620;
	const height = 360;

	let sides = $state(6);

	const sumInterior = $derived((sides - 2) * 180);
	const triangleCount = $derived(sides - 2);

	const scale = $derived(Math.min(width, height) * 0.37);
	const center = $derived({ x: width / 2, y: height / 2 + 6 });

	const vertices = $derived.by(() =>
		Array.from({ length: sides }, (_, index) => {
			const angle = -Math.PI / 2 + (index * Math.PI * 2) / sides;
			return {
				x: center.x + scale * Math.cos(angle),
				y: center.y + scale * Math.sin(angle)
			};
		})
	);

	const vertexLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const vertexLabelPoints = $derived.by(() =>
		vertices.map((vertex, index) => {
			const dx = vertex.x - center.x;
			const dy = vertex.y - center.y;
			const length = Math.hypot(dx, dy) || 1;
			const offset = 18;
			return {
				id: index,
				x: vertex.x + (dx / length) * offset,
				y: vertex.y + (dy / length) * offset,
				text: vertexLabels[index] ?? `V${index + 1}`
			};
		})
	);

	const polygonPath = $derived(
		vertices.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ') + ' Z'
	);

	const diagonalPaths = $derived.by(() =>
		Array.from({ length: triangleCount - 1 }, (_, index) => {
			const point = vertices[index + 2];
			return {
				id: index,
				x1: vertices[0].x,
				y1: vertices[0].y,
				x2: point.x,
				y2: point.y
			};
		})
	);
</script>

<div class="space-y-4">
	<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Sides:
			<span class="font-semibold text-foreground">{sides}</span>
		</p>
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Triangles from one vertex:
			<MathExpression math={`n-2=${triangleCount}`} class="ml-1 font-semibold text-foreground" />
		</p>
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Interior-angle sum:
			<MathExpression
				math={`(n-2)\\cdot180^\\circ=${sumInterior}^\\circ`}
				class="ml-1 font-semibold text-foreground"
			/>
		</p>
	</div>

	<svg
		viewBox={`0 0 ${width} ${height}`}
		class="h-auto w-full rounded-xl border border-border/70 bg-card/70"
		role="img"
		aria-label="Polygon triangulation into n minus 2 triangles"
		>
			<defs>
				<linearGradient id="poly-bg" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stop-color={TOOL_BG_GRADIENT_START}></stop>
					<stop offset="100%" stop-color={TOOL_BG_GRADIENT_END}></stop>
				</linearGradient>
			</defs>

		<rect x="0" y="0" width={width} height={height} fill="url(#poly-bg)"></rect>
		<path d={polygonPath} fill="rgba(255,255,255,0.68)" stroke="rgba(15,23,42,0.82)" stroke-width="2.1"></path>

		{#each diagonalPaths as line (line.id)}
			<line
				x1={line.x1}
				y1={line.y1}
				x2={line.x2}
				y2={line.y2}
				stroke="rgba(37,99,235,0.8)"
				stroke-width="1.7"
				stroke-dasharray="5 4"
			></line>
		{/each}

		{#each vertices as vertex, index (index)}
			<circle
				cx={vertex.x}
				cy={vertex.y}
				r="3.4"
				fill={index === 0 ? 'rgba(217,119,6,0.96)' : 'rgba(15,23,42,0.7)'}
			></circle>
		{/each}

		{#each vertexLabelPoints as label (label.id)}
			<text
				x={label.x}
				y={label.y}
				font-size="13"
				text-anchor="middle"
				dominant-baseline="central"
				fill={label.id === 0 ? 'rgba(120,53,15,0.95)' : 'rgba(15,23,42,0.85)'}
				font-weight={label.id === 0 ? '700' : '500'}
			>
				{label.text}
			</text>
		{/each}

		<text x="20" y="30" font-size="14" fill="rgba(15,23,42,0.84)">Draw diagonals from one vertex</text>
		<text x="20" y="50" font-size="13" fill="rgba(15,23,42,0.74)">You always create n - 2 triangles</text>
	</svg>

	<label class="space-y-1 text-xs font-medium text-muted-foreground">
		Number of sides n
		<input
			class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
			type="range"
			min="3"
			max="12"
			step="1"
			bind:value={sides}
		/>
	</label>
</div>
