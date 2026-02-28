<script lang="ts">
	import MathExpression from '$lib/components/math/math-expression.svelte';

	type Point = { x: number; y: number };

	const width = 620;
	const height = 360;
	const pad = 30;

	let sides = $state(6);

	const total = $derived((sides - 2) * 180);
	const interior = $derived(total / sides);

	const scale = $derived(Math.min(width, height) * 0.35);
	const center = $derived({ x: width / 2, y: height / 2 + 6 });

	const vertices = $derived.by(() =>
		Array.from({ length: sides }, (_, i) => {
			const angle = -Math.PI / 2 + (i * Math.PI * 2) / sides;
			return {
				x: center.x + scale * Math.cos(angle),
				y: center.y + scale * Math.sin(angle)
			};
		})
	);

	const path = $derived(
		vertices.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ') + ' Z'
	);

	function normalizeSignedAngle(angle: number) {
		let normalized = angle;
		while (normalized <= -Math.PI) normalized += Math.PI * 2;
		while (normalized > Math.PI) normalized -= Math.PI * 2;
		return normalized;
	}

	const angleArc = $derived.by(() => {
		const v = vertices[0];
		const prev = vertices[(sides - 1) % sides];
		const next = vertices[1];
		const r = Math.max(24, Math.min(38, scale * 0.18));
		const a1 = Math.atan2(prev.y - v.y, prev.x - v.x);
		const a2 = Math.atan2(next.y - v.y, next.x - v.x);
		const delta = normalizeSignedAngle(a2 - a1);
		const steps = 28;

		const points = Array.from({ length: steps + 1 }, (_, index) => {
			const t = index / steps;
			const angle = a1 + delta * t;
			return {
				x: v.x + r * Math.cos(angle),
				y: v.y + r * Math.sin(angle)
			};
		});

		const arcPath = points
			.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
			.join(' ');
		const fillPath = `M ${v.x} ${v.y} ${points.map((point) => `L ${point.x} ${point.y}`).join(' ')} Z`;
		const midAngle = a1 + delta / 2;
		const labelRadius = r + 16;

		return {
			arcPath,
			fillPath,
			label: {
				x: v.x + labelRadius * Math.cos(midAngle),
				y: v.y + labelRadius * Math.sin(midAngle)
			}
		};
	});
</script>

<div class="space-y-4">
	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Total interior sum:
			<MathExpression
				math={`(n-2)\\cdot180^\\circ=${total.toFixed(0)}^\\circ`}
				class="ml-1 font-semibold text-foreground"
			/>
		</p>
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Single interior angle:
			<MathExpression
				math={`\\theta_n=\\frac{${total.toFixed(0)}^\\circ}{${sides}}=${interior.toFixed(1)}^\\circ`}
				class="ml-1 font-semibold text-foreground"
			/>
		</p>
	</div>

	<svg
		viewBox={`0 0 ${width} ${height}`}
		class="h-auto w-full rounded-xl border border-border/70 bg-card/70"
		role="img"
		aria-label="Interior angle of a regular polygon"
	>
		<defs>
			<linearGradient id="angle-bg" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0%" stop-color="rgba(59,130,246,0.14)"></stop>
				<stop offset="100%" stop-color="rgba(20,184,166,0.08)"></stop>
			</linearGradient>
		</defs>
		<rect x={pad / 2} y={pad / 2} width={width - pad} height={height - pad} fill="url(#angle-bg)"></rect>
		<path d={path} fill="rgba(255,255,255,0.68)" stroke="rgba(15,23,42,0.84)" stroke-width="2.1"></path>
		<path d={angleArc.fillPath} fill="rgba(251,191,36,0.42)" stroke="none"></path>
		<path
			d={angleArc.arcPath}
			fill="none"
			stroke="rgba(217,119,6,0.95)"
			stroke-width="2.6"
			stroke-linecap="round"
		></path>
		<text x={angleArc.label.x} y={angleArc.label.y} font-size="14" fill="rgba(120,53,15,0.94)">
			{interior.toFixed(1)}°
		</text>
		<text x="20" y="30" font-size="14" fill="rgba(15,23,42,0.84)">Regular polygon interior angle</text>
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
