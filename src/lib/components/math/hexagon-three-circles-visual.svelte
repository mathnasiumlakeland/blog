<script module lang="ts">
	import type { MathToolMeta } from './tool-meta';

	export const toolMeta: MathToolMeta = {
		id: 'hexagon-three-circles-visual',
		title: 'Hexagon Minus Three Circles',
		description: 'Show a regular hexagon with three unit circles removed to visualize a target area.',
		inputs: 'Hexagon radius n controlled by a slider; tangent highlight updates automatically.',
		outputs: 'Hexagon area, center distance, target area, and tangent/non-tangent visual status.',
		useCase: 'Use for geometry lessons on composite area and tangent-circle constraints.',
		tags: ['geometry', 'area', 'circles', 'hexagon', 'tangent'],
		audience: ['students', 'instructors'],
		kind: 'interactive'
	};
</script>

<script lang="ts">
	import MathExpression from '$lib/components/math/math-expression.svelte';
	import { TOOL_BG_GRADIENT_END, TOOL_BG_GRADIENT_START } from './tool-visual-theme';

	type Point = { x: number; y: number };

	const viewWidth = 640;
	const viewHeight = 420;
	const padding = 34;
	const selectedVertices = [0, 2, 4];
	const tangentN = 2 / Math.sqrt(3);
	const tangentPairs: Array<[number, number]> = [
		[0, 2],
		[2, 4],
		[4, 0]
	];
	const tangentEpsilon = 0.01;

	let n = $state(tangentN);

	const hexArea = $derived((3 * Math.sqrt(3) * n * n) / 2);
	const removedArea = $derived(Math.PI);
	const targetArea = $derived(hexArea - removedArea);
	const centerDistance = $derived(Math.sqrt(3) * n);
	const circlesTangent = $derived(Math.abs(n - tangentN) <= tangentEpsilon);

	const extentUnits = $derived(n + 1.1);
	const scale = $derived(
		Math.min(
			(viewWidth - padding * 2) / (2 * extentUnits),
			(viewHeight - padding * 2) / (2 * extentUnits)
		)
	);
	const circleRadiusPx = $derived(scale);

	const vertices = $derived.by(() =>
		Array.from({ length: 6 }, (_, index) => {
			const angle = -Math.PI / 2 + (index * Math.PI) / 3;
			return {
				x: n * Math.cos(angle),
				y: n * Math.sin(angle)
			};
		})
	);

	function toSvg(point: Point): Point {
		return {
			x: viewWidth / 2 + point.x * scale,
			y: viewHeight / 2 + point.y * scale
		};
	}

	const verticesPx = $derived(vertices.map((vertex) => toSvg(vertex)));
	const hexPath = $derived(
		verticesPx.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ') + ' Z'
	);
	const circleCenters = $derived(selectedVertices.map((index) => verticesPx[index]));
	const tangentPoints = $derived.by(() =>
		tangentPairs.map(([left, right], index) => {
			const a = verticesPx[left];
			const b = verticesPx[right];
			return {
				id: index,
				x: (a.x + b.x) / 2,
				y: (a.y + b.y) / 2
			};
		})
	);
</script>

<div class="space-y-4">
	<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Hexagon area:
			<MathExpression
				math={`\\frac{3\\sqrt3}{2}\\cdot${n.toFixed(2)}^2=${hexArea.toFixed(3)}`}
				class="ml-1 font-semibold text-foreground"
			/>
		</p>
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Center distance:
			<MathExpression
				math={`d=\\sqrt3\\,n\\approx${centerDistance.toFixed(3)}`}
				class="ml-1 font-semibold text-foreground"
			/>
		</p>
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Target area:
			<MathExpression
				math={`A(${n.toFixed(2)})=\\frac{3\\sqrt3}{2}n^2-\\pi\\approx${targetArea.toFixed(3)}`}
				class="ml-1 font-semibold text-foreground"
			/>
		</p>
	</div>

	<svg
		viewBox={`0 0 ${viewWidth} ${viewHeight}`}
		class="h-auto w-full rounded-xl border border-border/70 bg-card/70"
		role="img"
		aria-label="Regular hexagon with three unit circles and highlighted target area"
		>
			<defs>
				<linearGradient id="hex-bg" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stop-color={TOOL_BG_GRADIENT_START}></stop>
					<stop offset="100%" stop-color={TOOL_BG_GRADIENT_END}></stop>
				</linearGradient>

				<linearGradient id="target-gradient" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stop-color="rgba(14, 165, 233, 0.72)"></stop>
					<stop offset="100%" stop-color="rgba(20, 184, 166, 0.72)"></stop>
				</linearGradient>

			<pattern id="target-grid" width="12" height="12" patternUnits="userSpaceOnUse">
				<path d="M 12 0 L 0 0 0 12" fill="none" stroke="rgba(255,255,255,0.27)" stroke-width="1"></path>
			</pattern>

			<mask id="target-mask">
				<rect x="0" y="0" width={viewWidth} height={viewHeight} fill="black"></rect>
				<path d={hexPath} fill="white"></path>
				{#each circleCenters as center, index (index)}
					<circle cx={center.x} cy={center.y} r={circleRadiusPx} fill="black"></circle>
				{/each}
			</mask>
		</defs>

			<rect x="0" y="0" width={viewWidth} height={viewHeight} fill="url(#hex-bg)"></rect>
		<rect
			x="0"
			y="0"
			width={viewWidth}
			height={viewHeight}
			fill="url(#target-gradient)"
			mask="url(#target-mask)"
		></rect>
		<rect
			x="0"
			y="0"
			width={viewWidth}
			height={viewHeight}
			fill="url(#target-grid)"
			mask="url(#target-mask)"
		></rect>

		<path d={hexPath} fill="none" stroke="rgba(15, 23, 42, 0.8)" stroke-width="2.3"></path>

		{#each circleCenters as center, index (index)}
			<circle
				cx={center.x}
				cy={center.y}
				r={circleRadiusPx}
				fill="rgba(255,255,255,0.78)"
				stroke="rgba(2, 132, 199, 0.95)"
				stroke-width="2"
			></circle>
			<circle cx={center.x} cy={center.y} r="3.1" fill="rgba(2, 132, 199, 0.95)"></circle>
		{/each}

		{#if circlesTangent}
			{#each tangentPoints as point (point.id)}
				<circle cx={point.x} cy={point.y} r="3.3" fill="rgba(217,119,6,0.97)"></circle>
			{/each}
		{/if}
	</svg>

	<label class="space-y-1 text-xs font-medium text-muted-foreground">
		Adjust hexagon radius n
		<input
			class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
			type="range"
			min={tangentN}
			max="4.2"
			step="0.01"
			bind:value={n}
		/>
	</label>

	<p
		class={`rounded-lg px-3 py-2 text-xs ${
			circlesTangent
				? 'border border-emerald-500/35 bg-emerald-100/60 text-emerald-900'
				: 'border border-border/70 bg-background/75 text-muted-foreground'
		}`}
	>
		<MathExpression math={`n_{\\text{tan}}=\\frac{2}{\\sqrt3}\\approx${tangentN.toFixed(3)}`} class="font-medium" />
		{#if circlesTangent}
			. This is the tangent setup: each pair of unit circles touches at one point.
		{:else}
			. Current n is larger, so circles no longer touch.
		{/if}
		Removed sector total remains
		<MathExpression math={`\\pi\\approx${removedArea.toFixed(3)}`} class="font-medium" />.
	</p>
</div>
