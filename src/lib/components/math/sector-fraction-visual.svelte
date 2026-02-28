<script lang="ts">
	import MathExpression from '$lib/components/math/math-expression.svelte';

	const width = 620;
	const height = 340;
	const center = { x: width / 2, y: height / 2 + 8 };
	const radius = 120;

	let theta = $state(120);
	let sectors = $state(3);

	const oneSector = $derived((theta / 360) * Math.PI);
	const total = $derived(sectors * oneSector);

	function pointOnCircle(degrees: number) {
		const radians = (degrees * Math.PI) / 180;
		return {
			x: center.x + radius * Math.cos(radians),
			y: center.y - radius * Math.sin(radians)
		};
	}

	const startDeg = 90;
	const endDeg = $derived(90 - theta);
	const p1 = $derived(pointOnCircle(startDeg));
	const p2 = $derived(pointOnCircle(endDeg));
	const largeArcFlag = $derived(theta > 180 ? 1 : 0);
	const isZeroSector = $derived(theta === 0);
	const isFullSector = $derived(theta === 360);
	const sectorPath = $derived(
		`M ${center.x} ${center.y} L ${p1.x} ${p1.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${p2.x} ${p2.y} Z`
	);
	const label = $derived({ x: center.x + 16, y: center.y - 48 });
</script>

<div class="space-y-4">
	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			One sector area:
			<MathExpression
				math={`\\frac{${theta.toFixed(0)}^\\circ}{360^\\circ}\\pi\\cdot1^2=${oneSector.toFixed(3)}`}
				class="ml-1 font-semibold text-foreground"
			/>
		</p>
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Total with {sectors} sectors:
			<MathExpression
				math={`${sectors}\\cdot${oneSector.toFixed(3)}=${total.toFixed(3)}`}
				class="ml-1 font-semibold text-foreground"
			/>
		</p>
	</div>

	<svg
		viewBox={`0 0 ${width} ${height}`}
		class="h-auto w-full rounded-xl border border-border/70 bg-card/70"
		role="img"
		aria-label="Circle sector fraction visualization"
	>
		<defs>
			<linearGradient id="sector-bg" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0%" stop-color="rgba(59,130,246,0.12)"></stop>
				<stop offset="100%" stop-color="rgba(20,184,166,0.08)"></stop>
			</linearGradient>
		</defs>
		<rect x="16" y="16" width={width - 32} height={height - 32} fill="url(#sector-bg)"></rect>
		<circle cx={center.x} cy={center.y} r={radius} fill="rgba(255,255,255,0.72)" stroke="rgba(15,23,42,0.82)" stroke-width="2"></circle>
		{#if isFullSector}
			<circle
				cx={center.x}
				cy={center.y}
				r={radius}
				fill="rgba(59,130,246,0.3)"
				stroke="rgba(37,99,235,0.92)"
				stroke-width="2"
			></circle>
		{:else if !isZeroSector}
			<path d={sectorPath} fill="rgba(59,130,246,0.3)" stroke="rgba(37,99,235,0.92)" stroke-width="2"></path>
		{/if}
		<circle cx={center.x} cy={center.y} r="3.5" fill="rgba(15,23,42,0.85)"></circle>
		<text x={label.x} y={label.y} font-size="14" fill="rgba(30,64,175,0.95)">
			θ = {theta.toFixed(0)}°
		</text>
		<text x="20" y="30" font-size="14" fill="rgba(15,23,42,0.84)">Sector area uses fraction θ/360°</text>
	</svg>

	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			Theta (degrees)
			<input
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
				type="range"
				min="0"
				max="360"
				step="1"
				bind:value={theta}
			/>
		</label>

		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			Number of equal sectors
			<input
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
				type="range"
				min="1"
				max="6"
				step="1"
				bind:value={sectors}
			/>
		</label>
	</div>
</div>
