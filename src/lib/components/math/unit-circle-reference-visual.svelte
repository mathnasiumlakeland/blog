<script module lang="ts">
	import type { MathToolMeta } from './tool-meta';
	import { requireInteractiveToolMetaById } from './tool-registry';

export const toolMeta: MathToolMeta = requireInteractiveToolMetaById('unit-circle-reference');
</script>

<script lang="ts">
	import MathExpression from '$lib/components/math/math-expression.svelte';
	import { TOOL_BG_GRADIENT_END, TOOL_BG_GRADIENT_START } from './tool-visual-theme';

	type SpecialAngle = {
		degree: number;
		radiansTex: string;
		cosTex: string;
		sinTex: string;
		cosLabel: string;
		sinLabel: string;
	};

	const SVG_SIZE = 620;
	const CENTER = SVG_SIZE / 2;
	const RADIUS = 192;
	const ANGLE_LABEL_RADIUS = RADIUS - 28;
	const COORD_LABEL_RADIUS = RADIUS + 34;

	const SPECIAL_ANGLES: SpecialAngle[] = [
		{ degree: 0, radiansTex: '0', cosTex: '1', sinTex: '0', cosLabel: '1', sinLabel: '0' },
		{
			degree: 30,
			radiansTex: '\\frac{\\pi}{6}',
			cosTex: '\\frac{\\sqrt{3}}{2}',
			sinTex: '\\frac{1}{2}',
			cosLabel: '√3/2',
			sinLabel: '1/2'
		},
		{
			degree: 45,
			radiansTex: '\\frac{\\pi}{4}',
			cosTex: '\\frac{\\sqrt{2}}{2}',
			sinTex: '\\frac{\\sqrt{2}}{2}',
			cosLabel: '√2/2',
			sinLabel: '√2/2'
		},
		{
			degree: 60,
			radiansTex: '\\frac{\\pi}{3}',
			cosTex: '\\frac{1}{2}',
			sinTex: '\\frac{\\sqrt{3}}{2}',
			cosLabel: '1/2',
			sinLabel: '√3/2'
		},
		{
			degree: 90,
			radiansTex: '\\frac{\\pi}{2}',
			cosTex: '0',
			sinTex: '1',
			cosLabel: '0',
			sinLabel: '1'
		},
		{
			degree: 120,
			radiansTex: '\\frac{2\\pi}{3}',
			cosTex: '-\\frac{1}{2}',
			sinTex: '\\frac{\\sqrt{3}}{2}',
			cosLabel: '-1/2',
			sinLabel: '√3/2'
		},
		{
			degree: 135,
			radiansTex: '\\frac{3\\pi}{4}',
			cosTex: '-\\frac{\\sqrt{2}}{2}',
			sinTex: '\\frac{\\sqrt{2}}{2}',
			cosLabel: '-√2/2',
			sinLabel: '√2/2'
		},
		{
			degree: 150,
			radiansTex: '\\frac{5\\pi}{6}',
			cosTex: '-\\frac{\\sqrt{3}}{2}',
			sinTex: '\\frac{1}{2}',
			cosLabel: '-√3/2',
			sinLabel: '1/2'
		},
		{
			degree: 180,
			radiansTex: '\\pi',
			cosTex: '-1',
			sinTex: '0',
			cosLabel: '-1',
			sinLabel: '0'
		},
		{
			degree: 210,
			radiansTex: '\\frac{7\\pi}{6}',
			cosTex: '-\\frac{\\sqrt{3}}{2}',
			sinTex: '-\\frac{1}{2}',
			cosLabel: '-√3/2',
			sinLabel: '-1/2'
		},
		{
			degree: 225,
			radiansTex: '\\frac{5\\pi}{4}',
			cosTex: '-\\frac{\\sqrt{2}}{2}',
			sinTex: '-\\frac{\\sqrt{2}}{2}',
			cosLabel: '-√2/2',
			sinLabel: '-√2/2'
		},
		{
			degree: 240,
			radiansTex: '\\frac{4\\pi}{3}',
			cosTex: '-\\frac{1}{2}',
			sinTex: '-\\frac{\\sqrt{3}}{2}',
			cosLabel: '-1/2',
			sinLabel: '-√3/2'
		},
		{
			degree: 270,
			radiansTex: '\\frac{3\\pi}{2}',
			cosTex: '0',
			sinTex: '-1',
			cosLabel: '0',
			sinLabel: '-1'
		},
		{
			degree: 300,
			radiansTex: '\\frac{5\\pi}{3}',
			cosTex: '\\frac{1}{2}',
			sinTex: '-\\frac{\\sqrt{3}}{2}',
			cosLabel: '1/2',
			sinLabel: '-√3/2'
		},
		{
			degree: 315,
			radiansTex: '\\frac{7\\pi}{4}',
			cosTex: '\\frac{\\sqrt{2}}{2}',
			sinTex: '-\\frac{\\sqrt{2}}{2}',
			cosLabel: '√2/2',
			sinLabel: '-√2/2'
		},
		{
			degree: 330,
			radiansTex: '\\frac{11\\pi}{6}',
			cosTex: '\\frac{\\sqrt{3}}{2}',
			sinTex: '-\\frac{1}{2}',
			cosLabel: '√3/2',
			sinLabel: '-1/2'
		}
	];

	let selectedDegree = $state(45);

	const markers = $derived.by(() =>
		SPECIAL_ANGLES.map((angle) => {
			const theta = (angle.degree * Math.PI) / 180;
			const ux = Math.cos(theta);
			const uy = Math.sin(theta);
			const pointX = CENTER + ux * RADIUS;
			const pointY = CENTER - uy * RADIUS;
			const angleLabelX = CENTER + ux * ANGLE_LABEL_RADIUS;
			const angleLabelY = CENTER - uy * ANGLE_LABEL_RADIUS;
			const coordLabelX =
				CENTER +
				ux * COORD_LABEL_RADIUS +
				(Math.abs(ux) > 0.22 ? (ux > 0 ? 20 : -20) : 0);
			const coordLabelY =
				CENTER -
				uy * COORD_LABEL_RADIUS +
				(Math.abs(uy) > 0.7 ? (uy > 0 ? -6 : 15) : 0);

			return {
				...angle,
				pointX,
				pointY,
				ux,
				uy,
				angleLabelX,
				angleLabelY,
				coordLabelX,
				coordLabelY,
				coordAnchor: ux > 0.22 ? 'start' : ux < -0.22 ? 'end' : 'middle'
			};
		})
	);

	const selected = $derived.by(
		() => markers.find((marker) => marker.degree === selectedDegree) ?? markers[0]
	);

	const selectedAngleTex = $derived.by(
		() => `\\theta=${selected.radiansTex}=${selected.degree}^\\circ`
	);
	const selectedCoordinateTex = $derived.by(
		() =>
			`(\\cos\\theta,\\sin\\theta)=\\left(${selected.cosTex},${selected.sinTex}\\right)`
	);
	const selectedTrigTex = $derived.by(
		() => `\\cos\\theta=${selected.cosTex},\\quad\\sin\\theta=${selected.sinTex}`
	);

	const angleArcPath = $derived.by(() => buildAngleArcPath(selected.degree, 68));
	const thetaLabelX = $derived.by(() => {
		const midTheta = ((selected.degree / 2) * Math.PI) / 180;
		return CENTER + Math.cos(midTheta) * 90;
	});
	const thetaLabelY = $derived.by(() => {
		const midTheta = ((selected.degree / 2) * Math.PI) / 180;
		return CENTER - Math.sin(midTheta) * 90;
	});

	function buildAngleArcPath(degree: number, arcRadius: number) {
		if (degree <= 0) {
			return '';
		}

		const theta = (degree * Math.PI) / 180;
		const steps = Math.max(8, Math.ceil(degree / 10));
		let path = `M ${CENTER + arcRadius} ${CENTER}`;

		for (let step = 1; step <= steps; step += 1) {
			const t = (theta * step) / steps;
			const px = CENTER + Math.cos(t) * arcRadius;
			const py = CENTER - Math.sin(t) * arcRadius;
			path += ` L ${px} ${py}`;
		}

		return path;
	}
</script>

<div class="space-y-4">
	<div class="grid gap-3 sm:grid-cols-3">
		<p class="rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
			Selected angle:
			<MathExpression
				math={selectedAngleTex}
				class="ml-1 inline-block whitespace-nowrap align-middle font-semibold text-foreground"
			/>
		</p>
		<p class="rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
			Point on circle:
			<MathExpression
				math={selectedCoordinateTex}
				class="ml-1 inline-block whitespace-nowrap align-middle font-semibold text-foreground"
			/>
		</p>
		<p class="rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
			Trig values:
			<MathExpression
				math={selectedTrigTex}
				class="ml-1 inline-block whitespace-nowrap align-middle font-semibold text-foreground"
			/>
		</p>
	</div>

	<svg
		viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
		class="h-auto w-full rounded-xl border border-border/70 bg-card/70 text-slate-900 dark:text-slate-100"
		role="img"
		aria-label="Unit circle with special angles and cosine-sine coordinate labels"
	>
		<defs>
			<linearGradient id="unit-circle-reference-bg" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0%" stop-color={TOOL_BG_GRADIENT_START}></stop>
				<stop offset="100%" stop-color={TOOL_BG_GRADIENT_END}></stop>
			</linearGradient>
		</defs>

		<rect x="0" y="0" width={SVG_SIZE} height={SVG_SIZE} fill="url(#unit-circle-reference-bg)"></rect>
		<circle cx={CENTER} cy={CENTER} r={RADIUS} fill="rgba(255,255,255,0.75)" stroke="#0f766e" stroke-width="2.6"></circle>

		<line x1={CENTER - RADIUS - 12} y1={CENTER} x2={CENTER + RADIUS + 12} y2={CENTER} stroke="#64748b" stroke-width="1.5"></line>
		<line x1={CENTER} y1={CENTER + RADIUS + 12} x2={CENTER} y2={CENTER - RADIUS - 12} stroke="#64748b" stroke-width="1.5"></line>

		{#if angleArcPath}
			<path d={angleArcPath} fill="none" stroke="#ea580c" stroke-width="2.4" stroke-linecap="round"></path>
		{/if}
		<text x={thetaLabelX} y={thetaLabelY} text-anchor="middle" class="fill-orange-700 text-sm font-semibold">
			θ
		</text>

		{#each markers as marker (marker.degree)}
			<line
				x1={CENTER}
				y1={CENTER}
				x2={marker.pointX}
				y2={marker.pointY}
				stroke={marker.degree === selectedDegree ? '#0f766e' : 'rgba(15,23,42,0.25)'}
				stroke-width={marker.degree === selectedDegree ? 2.4 : 1.2}
			></line>

			<circle
				cx={marker.pointX}
				cy={marker.pointY}
				r={marker.degree === selectedDegree ? 6.8 : 5.2}
				fill={marker.degree === selectedDegree ? '#f59e0b' : '#0f766e'}
				stroke={marker.degree === selectedDegree ? '#92400e' : '#134e4a'}
				stroke-width="1.8"
				role="button"
				tabindex="0"
				aria-label={`Select ${marker.degree} degree angle`}
				style="cursor: pointer;"
				onpointerdown={() => {
					selectedDegree = marker.degree;
				}}
				onkeydown={(event) => {
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault();
						selectedDegree = marker.degree;
					}
				}}
			></circle>

			<text
				x={marker.angleLabelX}
				y={marker.angleLabelY}
				text-anchor="middle"
				class={marker.degree === selectedDegree
					? 'fill-orange-700 text-[11px] font-semibold'
					: 'fill-slate-600 text-[10.5px] font-medium'}
			>
				{marker.degree}°
			</text>

			<text
				x={marker.coordLabelX}
				y={marker.coordLabelY}
				text-anchor={marker.coordAnchor}
				class={marker.degree === selectedDegree
					? 'fill-slate-900 text-[11px] font-semibold'
					: 'fill-slate-700 text-[10.5px] font-medium'}
			>
				({marker.cosLabel}, {marker.sinLabel})
			</text>
		{/each}

		<circle cx={CENTER} cy={CENTER} r="5.2" fill="#0f172a"></circle>
		<text x={CENTER + RADIUS + 24} y={CENTER - 10} class="fill-slate-600 text-xs font-semibold">
			x = cosθ
		</text>
		<text x={CENTER + 12} y={CENTER - RADIUS - 18} class="fill-slate-600 text-xs font-semibold">
			y = sinθ
		</text>
	</svg>

	<p class="text-xs text-muted-foreground">Tap any point on the circle to highlight that angle and its exact coordinates.</p>
</div>
