<script module lang="ts">
	import type { MathToolMeta } from './tool-meta';
	import { requireInteractiveToolMetaById } from './tool-registry';

	export const toolMeta: MathToolMeta = requireInteractiveToolMetaById('velocity-components');
</script>

<script lang="ts">
	import MathExpression from '$lib/components/math/math-expression.svelte';
	import { TOOL_BG_GRADIENT_START, TOOL_BG_GRADIENT_END } from './tool-visual-theme';

	const WIDTH = 520;
	const HEIGHT = 340;
	const OX = 110;
	const OY = 265;
	const VEC_LEN = 210;

	let angleDeg = $state(45);

	const theta = $derived(angleDeg * (Math.PI / 180));
	const cosT = $derived(Math.cos(theta));
	const sinT = $derived(Math.sin(theta));

	// Endpoint of v0 vector (diagonal)
	const vEndX = $derived(OX + VEC_LEN * cosT);
	const vEndY = $derived(OY - VEC_LEN * sinT);

	// Horizontal component endpoint — same y as origin, x same as v0 end
	const vxEndX = $derived(OX + VEC_LEN * cosT);
	const vxEndY = OY;

	// Vertical component: from vxEnd upward to vEnd
	const vyStartX = $derived(OX + VEC_LEN * cosT);
	const vyStartY = OY;
	const vyEndX = $derived(OX + VEC_LEN * cosT);
	const vyEndY = $derived(OY - VEC_LEN * sinT);

	// Right-angle marker (10px square)
	const raSize = 10;
	const raX = $derived(vxEndX - raSize);
	const raY = $derived(vxEndY - raSize);

	// Angle arc
	const arcR = 38;
	const arcEndX = $derived(OX + arcR * cosT);
	const arcEndY = $derived(OY - arcR * sinT);

	// Labels
	const vLabelX = $derived(OX + (VEC_LEN * 0.5) * cosT - 20 * sinT - 2);
	const vLabelY = $derived(OY - (VEC_LEN * 0.5) * sinT - 20 * cosT);
	const vxLabelX = $derived(OX + (VEC_LEN * 0.5) * cosT);
	const vyLabelX = $derived(vxEndX + 10);
	const vyLabelY = $derived((OY + vEndY) / 2);

	function fmt1(v: number) {
		return v.toFixed(2);
	}
</script>

<div class="space-y-4">
	<div class="tool-summary-grid">
		<p class="tool-summary-card rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			<MathExpression math="v_x = v_0\cos\theta" class="font-semibold text-foreground" />
		</p>
		<p class="tool-summary-card rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			<MathExpression math="v_y = v_0\sin\theta" class="font-semibold text-foreground" />
		</p>
		<p class="tool-summary-card rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			<MathExpression math="v_0^2 = v_x^2 + v_y^2" class="font-semibold text-foreground" />
		</p>
	</div>

	<svg
		viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
		class="h-auto w-full rounded-xl border border-border/70 bg-card/70"
		role="img"
		aria-label="Velocity vector component decomposition diagram"
	>
		<defs>
			<linearGradient id="vel-bg" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0%" stop-color={TOOL_BG_GRADIENT_START} />
				<stop offset="100%" stop-color={TOOL_BG_GRADIENT_END} />
			</linearGradient>
			<marker id="vel-arrow-dark" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
				<path d="M 0 0 L 9 3 L 0 6 Z" fill="#1e293b" />
			</marker>
			<marker id="vel-arrow-blue" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
				<path d="M 0 0 L 9 3 L 0 6 Z" fill="#3b82f6" />
			</marker>
			<marker id="vel-arrow-teal" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
				<path d="M 0 0 L 9 3 L 0 6 Z" fill="#14b8a6" />
			</marker>
		</defs>

		<rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="url(#vel-bg)" />

		<!-- Right-angle marker at vxEnd -->
		<polyline
			points={`${raX},${vxEndY} ${raX},${raY} ${vxEndX},${raY}`}
			fill="none"
			stroke="#64748b"
			stroke-width="1.4"
		/>

		<!-- Horizontal component (vx) -->
		<line
			x1={OX}
			y1={OY}
			x2={vxEndX - 8}
			y2={vxEndY}
			stroke="#3b82f6"
			stroke-width="2.8"
			stroke-linecap="round"
			marker-end="url(#vel-arrow-blue)"
		/>

		<!-- Vertical component (vy) -->
		<line
			x1={vyStartX}
			y1={vyStartY}
			x2={vyEndX}
			y2={vyEndY + 8}
			stroke="#14b8a6"
			stroke-width="2.8"
			stroke-linecap="round"
			marker-end="url(#vel-arrow-teal)"
		/>

		<!-- v0 diagonal vector -->
		<line
			x1={OX}
			y1={OY}
			x2={vEndX - 6 * cosT}
			y2={vEndY + 6 * sinT}
			stroke="#1e293b"
			stroke-width="3"
			stroke-linecap="round"
			marker-end="url(#vel-arrow-dark)"
		/>

		<!-- Angle arc -->
		<path
			d={`M ${OX + arcR} ${OY} A ${arcR} ${arcR} 0 0 0 ${arcEndX} ${arcEndY}`}
			fill="none"
			stroke="#f59e0b"
			stroke-width="1.8"
		/>
		<text x={OX + arcR + 8} y={OY - 10} font-size="13" fill="#f59e0b" font-weight="700">θ={angleDeg}°</text>

		<!-- v0 label (along diagonal) -->
		<text
			x={vLabelX}
			y={vLabelY}
			text-anchor="middle"
			font-size="15"
			fill="#1e293b"
			font-weight="700"
			font-style="italic"
		>v₀</text>

		<!-- vx label -->
		<text
			x={vxLabelX}
			y={OY + 22}
			text-anchor="middle"
			font-size="13"
			fill="#3b82f6"
			font-weight="600"
		>vₓ = v₀ cos θ</text>

		<!-- vy label -->
		<text
			x={vyLabelX}
			y={vyLabelY}
			font-size="13"
			fill="#14b8a6"
			font-weight="600"
		>vy = v₀ sin θ</text>

		<!-- Origin dot -->
		<circle cx={OX} cy={OY} r="4.5" fill="#1e293b" />
		<!-- Tip dot -->
		<circle cx={vEndX} cy={vEndY} r="4" fill="#1e293b" />
	</svg>

	<label class="flex flex-col gap-1.5 text-sm">
		<span class="text-muted-foreground">
			Launch angle:
			<MathExpression math={`\\theta=${angleDeg}^\\circ`} class="ml-1 font-semibold text-foreground" />
			<span class="ml-2 text-xs text-muted-foreground">
				(vₓ = {fmt1(Math.cos(angleDeg * Math.PI / 180))} v₀,
				vy = {fmt1(Math.sin(angleDeg * Math.PI / 180))} v₀)
			</span>
		</span>
		<input type="range" min="5" max="85" step="1" bind:value={angleDeg} class="accent-blue-500" />
	</label>
</div>
