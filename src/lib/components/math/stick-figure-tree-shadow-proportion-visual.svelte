<script module lang="ts">
	import type { MathToolMeta } from './tool-meta';
	import { requireInteractiveToolMetaById } from './tool-registry';

	export const toolMeta: MathToolMeta = requireInteractiveToolMetaById(
		'stick-figure-tree-shadow-proportion'
	);
</script>

<script lang="ts">
	import MathExpression from '$lib/components/math/math-expression.svelte';
	import { TOOL_BG_GRADIENT_END, TOOL_BG_GRADIENT_START } from './tool-visual-theme';

	const width = 640;
	const height = 360;
	const groundY = 284;
	const personBaseX = 150;
	const treeBaseX = 398;

	let personHeight = $state(5.4);
	let personShadow = $state(4.2);
	let treeShadow = $state(18);

	const treeHeight = $derived((personHeight / personShadow) * treeShadow);
	const maxHeightFeet = $derived(Math.max(personHeight, treeHeight, 10));
	const verticalPxPerFoot = $derived(190 / maxHeightFeet);
	const horizontalPxPerFoot = $derived(220 / Math.max(treeShadow, personShadow, 10));
	const pxPerFoot = $derived(Math.max(4.6, Math.min(13.5, verticalPxPerFoot, horizontalPxPerFoot)));

	const personHeightPx = $derived(personHeight * pxPerFoot);
	const treeHeightPx = $derived(treeHeight * pxPerFoot);
	const personShadowPx = $derived(personShadow * pxPerFoot);
	const treeShadowPx = $derived(treeShadow * pxPerFoot);

	const personTopY = $derived(groundY - personHeightPx);
	const treeTopY = $derived(groundY - treeHeightPx);
	const personShadowTipX = $derived(personBaseX + personShadowPx);
	const treeShadowTipX = $derived(treeBaseX + treeShadowPx);

	const personHeadRadius = $derived(Math.max(6, Math.min(14, personHeightPx * 0.16)));
	const personHeadCenterY = $derived(personTopY + personHeadRadius);
	const personNeckY = $derived(personHeadCenterY + personHeadRadius);
	const personHipY = $derived(groundY - personHeightPx * 0.36);
	const personArmY = $derived(personNeckY + (personHipY - personNeckY) * 0.28);
	const personArmSpan = $derived(Math.max(16, personHeightPx * 0.24));
	const personLegSpan = $derived(Math.max(12, personHeightPx * 0.18));

	const trunkWidth = $derived(Math.max(16, Math.min(30, treeHeightPx * 0.16)));
	const trunkTopY = $derived(treeTopY + treeHeightPx * 0.38);
	const canopyRadius = $derived(Math.max(24, Math.min(56, treeHeightPx * 0.26)));
	const canopyCenterY = $derived(treeTopY + canopyRadius * 0.95);

	const symbolicProportion =
		'\\frac{h_{\\text{person}}}{s_{\\text{person}}}=\\frac{h_{\\text{tree}}}{s_{\\text{tree}}}';
	const numericProportion = $derived(
		`\\frac{${personHeight.toFixed(1)}}{${personShadow.toFixed(1)}}=\\frac{${treeHeight.toFixed(1)}}{${treeShadow.toFixed(1)}}`
	);
	const solvedTreeHeight = $derived(
		`h_{\\text{tree}}=\\frac{${personHeight.toFixed(1)}\\cdot${treeShadow.toFixed(1)}}{${personShadow.toFixed(1)}}=${treeHeight.toFixed(1)}\\text{ ft}`
	);
</script>

<div class="space-y-4">
	<svg
		viewBox={`0 0 ${width} ${height}`}
		class="h-auto w-full rounded-xl border border-border/70 bg-card/70 text-slate-900 dark:text-slate-100"
		role="img"
		aria-label="Stick figure and tree shadow proportion model"
	>
		<defs>
			<linearGradient id="shadow-proportion-bg" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0%" stop-color={TOOL_BG_GRADIENT_START}></stop>
				<stop offset="100%" stop-color={TOOL_BG_GRADIENT_END}></stop>
			</linearGradient>
		</defs>

		<rect x="0" y="0" width={width} height={height} fill="url(#shadow-proportion-bg)"></rect>
		<rect x="0" y={groundY} width={width} height={height - groundY} fill="rgba(255,255,255,0.6)"></rect>

		<circle cx="76" cy="68" r="26" fill="rgba(250,204,21,0.9)" stroke="rgba(180,83,9,0.8)" stroke-width="1.8"></circle>
		<line
			x1="94"
			y1="84"
			x2={personShadowTipX}
			y2={groundY - 1}
			stroke="rgba(180,83,9,0.62)"
			stroke-width="1.8"
			stroke-linecap="round"
		></line>
		<line
			x1="99"
			y1="76"
			x2={treeShadowTipX}
			y2={groundY - 2}
			stroke="rgba(180,83,9,0.52)"
			stroke-width="1.8"
			stroke-linecap="round"
		></line>
		<text x="28" y="34" font-size="14" fill="currentColor">Same sun angle</text>

		<polygon
			points={`${personBaseX},${groundY} ${personShadowTipX},${groundY} ${personShadowTipX},${groundY - 10} ${personBaseX},${groundY - 2}`}
			fill="rgba(59,130,246,0.24)"
		></polygon>
		<polygon
			points={`${treeBaseX},${groundY} ${treeShadowTipX},${groundY} ${treeShadowTipX},${groundY - 14} ${treeBaseX},${groundY - 3}`}
			fill="rgba(37,99,235,0.24)"
		></polygon>

		<circle
			cx={personBaseX}
			cy={personHeadCenterY}
			r={personHeadRadius}
			fill="rgba(248,250,252,0.85)"
			stroke="rgba(15,23,42,0.84)"
			stroke-width="1.7"
		></circle>
		<line
			x1={personBaseX}
			y1={personNeckY}
			x2={personBaseX}
			y2={personHipY}
			stroke="rgba(15,23,42,0.88)"
			stroke-width="2.8"
			stroke-linecap="round"
		></line>
		<line
			x1={personBaseX - personArmSpan}
			y1={personArmY}
			x2={personBaseX + personArmSpan}
			y2={personArmY}
			stroke="rgba(15,23,42,0.88)"
			stroke-width="2.4"
			stroke-linecap="round"
		></line>
		<line
			x1={personBaseX}
			y1={personHipY}
			x2={personBaseX - personLegSpan}
			y2={groundY}
			stroke="rgba(15,23,42,0.88)"
			stroke-width="2.4"
			stroke-linecap="round"
		></line>
		<line
			x1={personBaseX}
			y1={personHipY}
			x2={personBaseX + personLegSpan}
			y2={groundY}
			stroke="rgba(15,23,42,0.88)"
			stroke-width="2.4"
			stroke-linecap="round"
		></line>

		<rect
			x={treeBaseX - trunkWidth / 2}
			y={trunkTopY}
			width={trunkWidth}
			height={groundY - trunkTopY}
			rx="4"
			fill="rgba(146,64,14,0.88)"
		></rect>
		<circle
			cx={treeBaseX}
			cy={canopyCenterY}
			r={canopyRadius}
			fill="rgba(34,197,94,0.45)"
			stroke="rgba(21,128,61,0.9)"
			stroke-width="2"
		></circle>
		<circle
			cx={treeBaseX - canopyRadius * 0.62}
			cy={canopyCenterY + canopyRadius * 0.18}
			r={canopyRadius * 0.62}
			fill="rgba(74,222,128,0.38)"
		></circle>
		<circle
			cx={treeBaseX + canopyRadius * 0.62}
			cy={canopyCenterY + canopyRadius * 0.18}
			r={canopyRadius * 0.62}
			fill="rgba(74,222,128,0.38)"
		></circle>

		<line
			x1={personBaseX - 34}
			y1={groundY}
			x2={personBaseX - 34}
			y2={personTopY}
			stroke="rgba(15,23,42,0.64)"
			stroke-width="1.4"
			stroke-dasharray="4 4"
		></line>
		<line
			x1={treeBaseX - trunkWidth / 2 - 30}
			y1={groundY}
			x2={treeBaseX - trunkWidth / 2 - 30}
			y2={treeTopY}
			stroke="rgba(15,23,42,0.64)"
			stroke-width="1.4"
			stroke-dasharray="4 4"
		></line>

		<line
			x1={personBaseX}
			y1={groundY + 16}
			x2={personShadowTipX}
			y2={groundY + 16}
			stroke="rgba(15,23,42,0.72)"
			stroke-width="1.8"
			stroke-linecap="round"
		></line>
		<line
			x1={treeBaseX}
			y1={groundY + 31}
			x2={treeShadowTipX}
			y2={groundY + 31}
			stroke="rgba(15,23,42,0.72)"
			stroke-width="1.8"
			stroke-linecap="round"
		></line>

		<text x={personBaseX - 56} y={personTopY - 8} font-size="13" fill="currentColor">
			h₁ = {personHeight.toFixed(1)} ft
		</text>
		<text x={treeBaseX - 74} y={treeTopY - 8} font-size="13" fill="currentColor">
			h₂ = {treeHeight.toFixed(1)} ft
		</text>
		<text x={(personBaseX + personShadowTipX) / 2 - 35} y={groundY + 12} font-size="13" fill="currentColor">
			s₁ = {personShadow.toFixed(1)} ft
		</text>
		<text x={(treeBaseX + treeShadowTipX) / 2 - 35} y={groundY + 27} font-size="13" fill="currentColor">
			s₂ = {treeShadow.toFixed(1)} ft
		</text>
	</svg>

	<div class="space-y-2 rounded-xl border border-border/70 bg-background/75 p-3 sm:p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Proportion as fractions</p>
		<div class="text-sm text-foreground">
			<MathExpression math={symbolicProportion} class="font-semibold" />
		</div>
		<div class="text-sm text-foreground">
			<MathExpression math={numericProportion} class="font-semibold" />
		</div>
		<div class="text-sm text-muted-foreground">
			<MathExpression math={solvedTreeHeight} class="font-semibold text-foreground" />
		</div>
	</div>

	<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			Stick figure height (ft)
			<input
				type="range"
				min="4"
				max="7"
				step="0.1"
				bind:value={personHeight}
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
			/>
		</label>

		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			Stick figure shadow (ft)
			<input
				type="range"
				min="2.5"
				max="6"
				step="0.1"
				bind:value={personShadow}
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
			/>
		</label>

		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			Tree shadow (ft)
			<input
				type="range"
				min="8"
				max="30"
				step="0.5"
				bind:value={treeShadow}
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
			/>
		</label>
	</div>
</div>
