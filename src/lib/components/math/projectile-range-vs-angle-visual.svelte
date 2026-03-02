<script module lang="ts">
	import type { MathToolMeta } from './tool-meta';
	import { requireInteractiveToolMetaById } from './tool-registry';

	export const toolMeta: MathToolMeta = requireInteractiveToolMetaById('projectile-range-vs-angle');
</script>

<script lang="ts">
	import MathExpression from '$lib/components/math/math-expression.svelte';

	const g = 9.8;
	const PLOT_WIDTH = 680;
	const PLOT_HEIGHT = 340;
	const PAD_LEFT = 72;
	const PAD_RIGHT = 24;
	const PAD_TOP = 28;
	const PAD_BOTTOM = 52;
	const innerW = PLOT_WIDTH - PAD_LEFT - PAD_RIGHT;
	const innerH = PLOT_HEIGHT - PAD_TOP - PAD_BOTTOM;

	// x-axis: degrees 0–90
	const X_MIN = 0;
	const X_MAX = 90;
	const xTicks = [0, 15, 30, 45, 60, 75, 90];

	let v0 = $state(100);
	let selAngle = $state(45);

	const rMax = $derived((v0 * v0) / g);
	const yMax = $derived(rMax * 1.12);

	const compAngle = $derived(90 - selAngle);

	function rangeAt(deg: number) {
		const t = deg * (Math.PI / 180);
		return (v0 * v0 * Math.sin(2 * t)) / g;
	}

	const selRange = $derived(rangeAt(selAngle));
	const compRange = $derived(rangeAt(compAngle));

	function toSvgX(deg: number) {
		return PAD_LEFT + ((deg - X_MIN) / (X_MAX - X_MIN)) * innerW;
	}

	function toSvgY(r: number) {
		return PAD_TOP + ((yMax - r) / yMax) * innerH;
	}

	const groundY = $derived(toSvgY(0));

	const curvePoints = $derived.by(() => {
		const pts: string[] = [];
		for (let deg = 0; deg <= 90; deg += 0.5) {
			pts.push(`${toSvgX(deg).toFixed(1)},${toSvgY(rangeAt(deg)).toFixed(1)}`);
		}
		return pts.join(' ');
	});

	// x line at 45 degrees
	const x45 = $derived(toSvgX(45));

	// selected angle marker
	const selX = $derived(toSvgX(selAngle));
	const selY = $derived(toSvgY(selRange));
	const compX = $derived(toSvgX(compAngle));
	const compY = $derived(toSvgY(compRange));

	const yTicks = $derived.by(() => {
		const step = rMax / 4;
		return Array.from({ length: 5 }, (_, i) => i * step);
	});

	function fmt(v: number, d = 0) {
		return v.toFixed(d);
	}

	function formatKm(m: number) {
		return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m.toFixed(0)} m`;
	}
</script>

<div class="space-y-4">
	<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			At θ = {selAngle}°:
			<MathExpression math={`R\\approx${fmt(selRange, 0)}\\text{ m}`} class="ml-1 font-semibold text-foreground" />
		</p>
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Complement θ = {compAngle}°:
			<MathExpression math={`R\\approx${fmt(compRange, 0)}\\text{ m}`} class="ml-1 font-semibold text-foreground" />
		</p>
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Max range (45°):
			<MathExpression math={`R_{\\max}\\approx${fmt(rMax, 0)}\\text{ m}`} class="ml-1 font-semibold text-foreground" />
		</p>
	</div>

	<svg
		viewBox={`0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`}
		class="h-auto w-full rounded-xl border border-border/70 bg-white"
		role="img"
		aria-label="Projectile range as a function of launch angle"
	>
		<!-- White plot area -->
		<rect x={PAD_LEFT} y={PAD_TOP} width={innerW} height={innerH} fill="white" />

		<!-- Grid + y-axis ticks -->
		{#each yTicks as tick (tick)}
			<line
				x1={PAD_LEFT}
				y1={toSvgY(tick)}
				x2={PAD_LEFT + innerW}
				y2={toSvgY(tick)}
				stroke="#e2e8f0"
				stroke-width="1"
			/>
			<text x={PAD_LEFT - 8} y={toSvgY(tick) + 4} text-anchor="end" font-size="10" fill="#64748b">
				{fmt(tick, 0)}
			</text>
		{/each}

		<!-- x-axis ticks -->
		{#each xTicks as deg (deg)}
			<line
				x1={toSvgX(deg)}
				y1={PAD_TOP}
				x2={toSvgX(deg)}
				y2={PAD_TOP + innerH}
				stroke="#e2e8f0"
				stroke-width="1"
			/>
			<text x={toSvgX(deg)} y={PAD_TOP + innerH + 16} text-anchor="middle" font-size="10" fill="#64748b">
				{deg}°
			</text>
		{/each}

		<!-- Axes -->
		<line x1={PAD_LEFT} y1={groundY} x2={PAD_LEFT + innerW} y2={groundY} stroke="#475569" stroke-width="2" />
		<line x1={PAD_LEFT} y1={PAD_TOP} x2={PAD_LEFT} y2={groundY} stroke="#475569" stroke-width="1.5" />

		<!-- 45° peak dashed line -->
		<line
			x1={x45}
			y1={PAD_TOP}
			x2={x45}
			y2={groundY}
			stroke="#f59e0b"
			stroke-width="1.5"
			stroke-dasharray="5,4"
		/>
		<text x={x45} y={PAD_TOP - 6} text-anchor="middle" font-size="11" fill="#f59e0b" font-weight="700">
			45° (max)
		</text>

		<!-- Range curve -->
		<polyline
			points={curvePoints}
			fill="none"
			stroke="#3b82f6"
			stroke-width="2.5"
			stroke-linejoin="round"
		/>

		<!-- Complementary angle line (same range) – only when selAngle ≠ 45 -->
		{#if Math.abs(selAngle - 45) > 1}
			<line
				x1={selX}
				y1={selY}
				x2={compX}
				y2={compY}
				stroke="#94a3b8"
				stroke-width="1.2"
				stroke-dasharray="4,3"
			/>
			<!-- Complement marker -->
			<circle cx={compX} cy={compY} r="5" fill="none" stroke="#64748b" stroke-width="2" />
		{/if}

		<!-- Selected angle marker -->
		<line x1={selX} y1={PAD_TOP} x2={selX} y2={groundY} stroke="#ef4444" stroke-width="1.4" stroke-dasharray="4,3" />
		<circle cx={selX} cy={selY} r="5.5" fill="#ef4444" />
		<text x={selX} y={selY - 12} text-anchor="middle" font-size="11" fill="#ef4444" font-weight="700">
			θ={selAngle}°
		</text>

		<!-- Axis labels -->
		<text x={PAD_LEFT + innerW / 2} y={PLOT_HEIGHT - 6} text-anchor="middle" font-size="12" fill="#475569" font-style="italic">θ (degrees)</text>
		<text
			x="14"
			y={PAD_TOP + innerH / 2}
			text-anchor="middle"
			font-size="12"
			fill="#475569"
			font-style="italic"
			transform={`rotate(-90, 14, ${PAD_TOP + innerH / 2})`}
		>R (m)</text>
	</svg>

	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
		<label class="flex flex-col gap-1.5 text-sm">
			<span class="text-muted-foreground">
				Initial speed:
				<MathExpression math={`v_0=${v0}\\text{ m/s}`} class="ml-1 font-semibold text-foreground" />
			</span>
			<input type="range" min="50" max="500" step="10" bind:value={v0} class="accent-blue-500" />
		</label>
		<label class="flex flex-col gap-1.5 text-sm">
			<span class="text-muted-foreground">
				Launch angle:
				<MathExpression math={`\\theta=${selAngle}^\\circ`} class="ml-1 font-semibold text-foreground" />
			</span>
			<input type="range" min="5" max="85" step="1" bind:value={selAngle} class="accent-red-500" />
		</label>
	</div>

	{#if Math.abs(selAngle - 45) > 1}
		<p class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Notice: θ = {selAngle}° and its complement θ = {compAngle}° give the same range! The dashed line above connects them.
		</p>
	{/if}
</div>
