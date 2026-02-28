<script lang="ts">
	import MathExpression from '$lib/components/math/math-expression.svelte';

	type Point = { x: number; y: number };

	const width = 620;
	const height = 360;
	const padding = 30;
	const tangentN = 2 / Math.sqrt(3);

	let n = $state(tangentN);

	const h = $derived(Math.sqrt(Math.max(0, n * n - (n / 2) ** 2)));
	const triangleArea = $derived((n * h) / 2);
	const hexArea = $derived(6 * triangleArea);

	const scale = $derived(Math.min(width, height) * 0.34 / Math.max(0.7, n));
	const center = $derived({ x: width / 2, y: height / 2 + 8 });

	const vertices = $derived.by(() =>
		Array.from({ length: 6 }, (_, i) => {
			const angle = -Math.PI / 2 + (i * Math.PI) / 3;
			return {
				x: center.x + n * scale * Math.cos(angle),
				y: center.y + n * scale * Math.sin(angle)
			};
		})
	);

	const path = $derived(
		vertices.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ') + ' Z'
	);

	const midpoint = $derived({
		x: (vertices[0].x + vertices[1].x) / 2,
		y: (vertices[0].y + vertices[1].y) / 2
	});
</script>

<div class="space-y-4">
	<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Height:
			<MathExpression
				math={`h=\\sqrt{${n.toFixed(2)}^2-\\left(\\frac{${n.toFixed(2)}}{2}\\right)^2}=${h.toFixed(3)}`}
				class="ml-1 font-semibold text-foreground"
			/>
		</p>
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			One triangle area:
			<MathExpression
				math={`\\frac{1}{2}\\cdot${n.toFixed(2)}\\cdot${h.toFixed(3)}=${triangleArea.toFixed(3)}`}
				class="ml-1 font-semibold text-foreground"
			/>
		</p>
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Hexagon area:
			<MathExpression math={`6\\cdot${triangleArea.toFixed(3)}=${hexArea.toFixed(3)}`} class="ml-1 font-semibold text-foreground" />
		</p>
	</div>

	<svg
		viewBox={`0 0 ${width} ${height}`}
		class="h-auto w-full rounded-xl border border-border/70 bg-card/70"
		role="img"
		aria-label="Hexagon decomposed into six equilateral triangles"
	>
		<defs>
			<linearGradient id="tri-bg" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0%" stop-color="rgba(59,130,246,0.12)"></stop>
				<stop offset="100%" stop-color="rgba(20,184,166,0.09)"></stop>
			</linearGradient>
		</defs>
		<rect x={padding / 2} y={padding / 2} width={width - padding} height={height - padding} fill="url(#tri-bg)"></rect>
		<path d={path} fill="rgba(255,255,255,0.68)" stroke="rgba(15,23,42,0.84)" stroke-width="2.1"></path>

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
			x2={midpoint.x}
			y2={midpoint.y}
			stroke="rgba(217,119,6,0.94)"
			stroke-width="2"
			stroke-dasharray="5 4"
		></line>
		<circle cx={midpoint.x} cy={midpoint.y} r="3.2" fill="rgba(217,119,6,0.95)"></circle>
		<text x={midpoint.x + 8} y={midpoint.y + 2} font-size="13" fill="rgba(120,53,15,0.95)">h</text>

		<text x="20" y="30" font-size="14" fill="rgba(15,23,42,0.84)">6 equilateral triangles build the hexagon</text>
	</svg>

	<label class="space-y-1 text-xs font-medium text-muted-foreground">
		Hexagon radius and side length n
		<input
			class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
			type="range"
			min={tangentN}
			max="3"
			step="0.01"
			bind:value={n}
		/>
	</label>

	<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-xs text-muted-foreground">
		Default is the tangent setup:
		<MathExpression math={`n=\\frac{2}{\\sqrt3}\\approx${tangentN.toFixed(3)}`} class="ml-1 font-medium text-foreground" />
	</p>
</div>
