<script module lang="ts">
	import type { MathToolMeta } from './tool-meta';
	import { requireInteractiveToolMetaById } from './tool-registry';

	export const toolMeta: MathToolMeta = requireInteractiveToolMetaById('projectile-trajectory');
</script>

<script lang="ts">
	import MathExpression from '$lib/components/math/math-expression.svelte';

	const g = 9.8;
	const PLOT_WIDTH = 680;
	const PLOT_HEIGHT = 360;
	const PAD_LEFT = 64;
	const PAD_RIGHT = 28;
	const PAD_TOP = 32;
	const PAD_BOTTOM = 56;
	const X_AXIS_MIN = 0;
	const X_AXIS_MAX = 4500;
	const Y_AXIS_MAX = 2500;
	const innerW = PLOT_WIDTH - PAD_LEFT - PAD_RIGHT;
	const innerH = PLOT_HEIGHT - PAD_TOP - PAD_BOTTOM;

	let v0 = $state(155);
	let angleDeg = $state(45);

	const theta = $derived(angleDeg * (Math.PI / 180));
	const vx = $derived(v0 * Math.cos(theta));
	const vy = $derived(v0 * Math.sin(theta));
	const flightTime = $derived((2 * vy) / g);
	const maxHeight = $derived((vy * vy) / (2 * g));
	const range = $derived((v0 * v0 * Math.sin(2 * theta)) / g);

	function toSvgX(x: number) {
		return PAD_LEFT + ((x - X_AXIS_MIN) / (X_AXIS_MAX - X_AXIS_MIN)) * innerW;
	}

	function toSvgY(y: number) {
		return PAD_TOP + ((Y_AXIS_MAX - y) / Y_AXIS_MAX) * innerH;
	}

	const groundY = $derived(toSvgY(0));
	const peakSvgX = $derived(toSvgX(range / 2));
	const peakSvgY = $derived(toSvgY(maxHeight));
	const landSvgX = $derived(toSvgX(range));

	const trajectoryPoints = $derived.by(() => {
		const SAMPLES = 120;
		const pts: string[] = [];
		for (let i = 0; i <= SAMPLES; i++) {
			const t = (i / SAMPLES) * flightTime;
			const x = vx * t;
			const y = vy * t - 0.5 * g * t * t;
			pts.push(`${toSvgX(x).toFixed(1)},${toSvgY(y).toFixed(1)}`);
		}
		return pts.join(' ');
	});

	// Launch angle arc on SVG (y-down)
	const arcR = 32;
	const arcEndX = $derived(PAD_LEFT + arcR * Math.cos(theta));
	const arcEndY = $derived(groundY - arcR * Math.sin(theta));

	// Launch velocity arrow end
	const arrowLen = 48;
	const arrowEndX = $derived(PAD_LEFT + arrowLen * Math.cos(theta));
	const arrowEndY = $derived(groundY - arrowLen * Math.sin(theta));

	const xTicks = [0, 900, 1800, 2700, 3600, 4500];

	const yTicks = [0, 500, 1000, 1500, 2000, 2500];

	function fmt(v: number, d = 1) {
		return v.toFixed(d);
	}

	function fmtAngle(deg: number) {
		return `${deg}^\\circ`;
	}
</script>

<div class="space-y-4">
	<div class="tool-summary-grid">
		<p class="tool-summary-card rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Time of flight:
			<MathExpression math={`T\\approx${fmt(flightTime)}\\text{ s}`} class="ml-1 font-semibold text-foreground" />
		</p>
		<p class="tool-summary-card rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Max height:
			<MathExpression math={`H\\approx${fmt(maxHeight, 0)}\\text{ m}`} class="ml-1 font-semibold text-foreground" />
		</p>
		<p class="tool-summary-card rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Range:
			<MathExpression math={`R\\approx${fmt(range, 0)}\\text{ m}`} class="ml-1 font-semibold text-foreground" />
		</p>
	</div>

	<svg
		viewBox={`0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`}
		class="h-auto w-full rounded-xl border border-border/70 bg-white"
		role="img"
		aria-label="Interactive projectile trajectory plot"
	>
		<defs>
			<marker id="traj-arrow-dark" markerWidth="8" markerHeight="8" refX="6" refY="2.5" orient="auto">
				<path d="M 0 0 L 8 2.5 L 0 5 Z" fill="#1e293b" />
			</marker>
			<marker id="traj-arrow-blue" markerWidth="8" markerHeight="8" refX="6" refY="2.5" orient="auto">
				<path d="M 0 0 L 8 2.5 L 0 5 Z" fill="#3b82f6" />
			</marker>
		</defs>

		<!-- White plot area -->
		<rect x={PAD_LEFT} y={PAD_TOP} width={innerW} height={innerH} fill="white" />

		<!-- Grid lines -->
		{#each yTicks as tick (tick)}
			<line
				x1={PAD_LEFT}
				y1={toSvgY(tick)}
				x2={PAD_LEFT + innerW}
				y2={toSvgY(tick)}
				stroke="#e2e8f0"
				stroke-width="1"
			/>
			<text
				x={PAD_LEFT - 8}
				y={toSvgY(tick) + 4}
				text-anchor="end"
				font-size="10"
				fill="#64748b"
			>{fmt(tick, 0)}</text>
		{/each}

		{#each xTicks as tick (tick)}
			<line
				x1={toSvgX(tick)}
				y1={PAD_TOP}
				x2={toSvgX(tick)}
				y2={PAD_TOP + innerH}
				stroke="#e2e8f0"
				stroke-width="1"
			/>
			<text
				x={toSvgX(tick)}
				y={PAD_TOP + innerH + 16}
				text-anchor="middle"
				font-size="10"
				fill="#64748b"
			>{fmt(tick, 0)}</text>
		{/each}

		<!-- Axes -->
		<line x1={PAD_LEFT} y1={groundY} x2={PAD_LEFT + innerW} y2={groundY} stroke="#475569" stroke-width="2" />
		<line x1={PAD_LEFT} y1={PAD_TOP} x2={PAD_LEFT} y2={groundY} stroke="#475569" stroke-width="1.5" />

		<!-- Peak dashed lines -->
		<line
			x1={PAD_LEFT}
			y1={peakSvgY}
			x2={peakSvgX}
			y2={peakSvgY}
			stroke="#94a3b8"
			stroke-width="1"
			stroke-dasharray="4,3"
		/>
		<line
			x1={peakSvgX}
			y1={PAD_TOP}
			x2={peakSvgX}
			y2={groundY}
			stroke="#94a3b8"
			stroke-width="1"
			stroke-dasharray="4,3"
		/>

		<!-- H label -->
		<text
			x={PAD_LEFT - 8}
			y={(peakSvgY + groundY) / 2 + 4}
			text-anchor="end"
			font-size="12"
			fill="#14b8a6"
			font-weight="600"
		>H</text>

		<!-- Range arrow under ground -->
		<line
			x1={PAD_LEFT}
			y1={groundY + 22}
			x2={landSvgX - 2}
			y2={groundY + 22}
			stroke="#3b82f6"
			stroke-width="2"
			marker-end="url(#traj-arrow-blue)"
		/>
		<text
			x={(PAD_LEFT + landSvgX) / 2}
			y={groundY + 36}
			text-anchor="middle"
			font-size="11"
			fill="#3b82f6"
			font-weight="600"
		>R = {fmt(range, 0)} m</text>

		<!-- Trajectory curve -->
		<polyline
			points={trajectoryPoints}
			fill="none"
			stroke="#3b82f6"
			stroke-width="2.5"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>

		<!-- Launch angle arc -->
		<path
			d={`M ${PAD_LEFT + arcR} ${groundY} A ${arcR} ${arcR} 0 0 0 ${arcEndX} ${arcEndY}`}
			fill="none"
			stroke="#f59e0b"
			stroke-width="1.8"
		/>
		<text x={PAD_LEFT + arcR + 6} y={groundY - 6} font-size="11" fill="#f59e0b" font-weight="600">θ={angleDeg}°</text>

		<!-- Launch velocity arrow -->
		<line
			x1={PAD_LEFT}
			y1={groundY}
			x2={arrowEndX}
			y2={arrowEndY}
			stroke="#1e293b"
			stroke-width="2.2"
			marker-end="url(#traj-arrow-dark)"
		/>

		<!-- Origin point -->
		<circle cx={PAD_LEFT} cy={groundY} r="4" fill="#1e293b" />
		<!-- Peak point -->
		<circle cx={peakSvgX} cy={peakSvgY} r="4.5" fill="#14b8a6" />
		<!-- Landing point -->
		<circle cx={landSvgX} cy={groundY} r="5" fill="#ef4444" />

		<!-- Axis labels -->
		<text x={PAD_LEFT + innerW / 2} y={PLOT_HEIGHT - 6} text-anchor="middle" font-size="12" fill="#475569" font-style="italic">x (m)</text>
		<text
			x="14"
			y={PAD_TOP + innerH / 2}
			text-anchor="middle"
			font-size="12"
			fill="#475569"
			font-style="italic"
			transform={`rotate(-90, 14, ${PAD_TOP + innerH / 2})`}
		>y (m)</text>
	</svg>

	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
		<label class="flex flex-col gap-1.5 text-sm">
			<span class="text-muted-foreground">
				Initial speed:
				<MathExpression math={`v_0=${v0}\\text{ m/s}`} class="ml-1 font-semibold text-foreground" />
			</span>
			<input type="range" min="20" max="200" step="5" bind:value={v0} class="accent-blue-500" />
		</label>
		<label class="flex flex-col gap-1.5 text-sm">
			<span class="text-muted-foreground">
				Launch angle:
				<MathExpression math={`\\theta=${fmtAngle(angleDeg)}`} class="ml-1 font-semibold text-foreground" />
			</span>
			<input type="range" min="5" max="85" step="1" bind:value={angleDeg} class="accent-blue-500" />
		</label>
	</div>
</div>
