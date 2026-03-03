<script module lang="ts">
	import type { MathToolMeta } from './tool-meta';
	import { requireInteractiveToolMetaById } from './tool-registry';

export const toolMeta: MathToolMeta =
		requireInteractiveToolMetaById('unit-circle-pythagorean-identity');
</script>

<script lang="ts">
	import MathExpression from '$lib/components/math/math-expression.svelte';

	const PLOT_SIZE = 420;
	const PLOT_PADDING = 34;
	const PLOT_INNER_SIZE = PLOT_SIZE - PLOT_PADDING * 2;
	const DOMAIN_MIN = -1.35;
	const DOMAIN_MAX = 1.35;
	const POINT_HIT_RADIUS = 18;
	const gridTicks = [-1, -0.5, 0, 0.5, 1];
	const majorTicks = [-1, 0, 1];

	let angle = $state(Math.PI / 4);
	let plotSvg: SVGSVGElement | null = $state(null);
	let activeDrag = $state(false);

	const x = $derived(Math.cos(angle));
	const y = $derived(Math.sin(angle));

	const originScreenX = $derived(toScreenX(0));
	const originScreenY = $derived(toScreenY(0));
	const pointScreenX = $derived(toScreenX(x));
	const pointScreenY = $derived(toScreenY(y));
	const unitRadiusPx = $derived(Math.abs(toScreenX(1) - toScreenX(0)));

	const xLabelX = $derived((originScreenX + pointScreenX) / 2);
	const xLabelY = $derived(originScreenY + 18);
	const yLabelX = $derived(pointScreenX + (x >= 0 ? 10 : -10));
	const yLabelY = $derived((originScreenY + pointScreenY) / 2);
	const yLabelAnchor = $derived(x >= 0 ? 'start' : 'end');
	const pointLabelX = $derived(pointScreenX + (x >= 0 ? 12 : -12));
	const pointLabelY = $derived(pointScreenY + (y >= 0 ? -10 : 16));
	const pointLabelAnchor = $derived(x >= 0 ? 'start' : 'end');
	const radiusLabelX = $derived((originScreenX + pointScreenX) / 2 - y * 12);
	const radiusLabelY = $derived((originScreenY + pointScreenY) / 2 - x * 12);

	const coordinateLabel = $derived.by(() => `(${formatNumber(x)}, ${formatNumber(y)})`);
	const identityNumericalSummary = $derived.by(() => {
		const x2 = formatNumber(x * x, 3);
		const y2 = formatNumber(y * y, 3);
		return `x^2 + y^2 = ${x2} + ${y2} = 1`;
	});
	const angleSummary = $derived.by(() => formatInteriorAngleSummary(angle));
	const radiusDirection = $derived.by(() => Math.atan2(y, x));
	const interiorBaseAngle = $derived.by(() => (x >= 0 ? 0 : Math.PI));
	const interiorSweepAngle = $derived.by(() =>
		normalizeSignedAngle(radiusDirection - interiorBaseAngle)
	);
	const thetaArcRadius = $derived.by(() => Math.min(56, Math.max(32, unitRadiusPx * 0.24)));
	const thetaArcPath = $derived.by(() =>
		buildAngleArcPath(
			interiorBaseAngle,
			interiorSweepAngle,
			thetaArcRadius,
			originScreenX,
			originScreenY
		)
	);
	const thetaLabelAngle = $derived.by(() => interiorBaseAngle + interiorSweepAngle / 2);
	const thetaLabelX = $derived(
		originScreenX + Math.cos(thetaLabelAngle) * (thetaArcRadius + 12)
	);
	const thetaLabelY = $derived(
		originScreenY - Math.sin(thetaLabelAngle) * (thetaArcRadius + 12)
	);

	function toScreenX(value: number) {
		return PLOT_PADDING + ((value - DOMAIN_MIN) / (DOMAIN_MAX - DOMAIN_MIN)) * PLOT_INNER_SIZE;
	}

	function toScreenY(value: number) {
		return PLOT_PADDING + ((DOMAIN_MAX - value) / (DOMAIN_MAX - DOMAIN_MIN)) * PLOT_INNER_SIZE;
	}

	function toPlotX(screenX: number) {
		return DOMAIN_MIN + ((screenX - PLOT_PADDING) / PLOT_INNER_SIZE) * (DOMAIN_MAX - DOMAIN_MIN);
	}

	function toPlotY(screenY: number) {
		return DOMAIN_MAX - ((screenY - PLOT_PADDING) / PLOT_INNER_SIZE) * (DOMAIN_MAX - DOMAIN_MIN);
	}

	function clamp(value: number, min: number, max: number) {
		return Math.min(max, Math.max(min, value));
	}

	function normalizeAngle(value: number) {
		return value < 0 ? value + Math.PI * 2 : value;
	}

	function normalizeSignedAngle(value: number) {
		let wrapped = (value + Math.PI) % (Math.PI * 2);
		if (wrapped < 0) {
			wrapped += Math.PI * 2;
		}
		return wrapped - Math.PI;
	}

	function pointerToSvgPoint(event: PointerEvent) {
		if (!plotSvg) {
			return null;
		}

		const rect = plotSvg.getBoundingClientRect();
		if (rect.width === 0 || rect.height === 0) {
			return null;
		}

		const rawX = ((event.clientX - rect.left) / rect.width) * PLOT_SIZE;
		const rawY = ((event.clientY - rect.top) / rect.height) * PLOT_SIZE;

		return {
			x: clamp(rawX, PLOT_PADDING, PLOT_SIZE - PLOT_PADDING),
			y: clamp(rawY, PLOT_PADDING, PLOT_SIZE - PLOT_PADDING)
		};
	}

	function updateAngleFromPointer(event: PointerEvent) {
		const svgPoint = pointerToSvgPoint(event);
		if (!svgPoint) {
			return;
		}

		const plotX = toPlotX(svgPoint.x);
		const plotY = toPlotY(svgPoint.y);
		if (Math.hypot(plotX, plotY) < 0.01) {
			return;
		}

		angle = normalizeAngle(Math.atan2(plotY, plotX));
	}

	function handlePlotPointerDown(event: PointerEvent) {
		const svgPoint = pointerToSvgPoint(event);
		if (!svgPoint) {
			return;
		}

		const nearPoint =
			Math.hypot(svgPoint.x - pointScreenX, svgPoint.y - pointScreenY) <= POINT_HIT_RADIUS;
		if (!nearPoint) {
			return;
		}

		event.preventDefault();
		activeDrag = true;
		plotSvg?.setPointerCapture(event.pointerId);
		updateAngleFromPointer(event);
	}

	function handlePlotPointerMove(event: PointerEvent) {
		if (!activeDrag) {
			return;
		}
		event.preventDefault();
		updateAngleFromPointer(event);
	}

	function stopDrag(event: PointerEvent) {
		if (!activeDrag) {
			return;
		}
		activeDrag = false;
		if (plotSvg?.hasPointerCapture(event.pointerId)) {
			plotSvg.releasePointerCapture(event.pointerId);
		}
	}

	function formatNumber(value: number, decimals = 2) {
		const rounded = value.toFixed(decimals);
		return Number.parseFloat(rounded) === 0 ? rounded.replace('-', '') : rounded;
	}

	function formatInteriorAngleSummary(value: number) {
		const degrees = ((value * 180) / Math.PI + 360) % 360;
		const angleText = `${degrees.toFixed(0)}^\\circ`;

		if (degrees <= 90) {
			return angleText;
		}
		if (degrees <= 180) {
			return `180^\\circ-${angleText}=${(180 - degrees).toFixed(0)}^\\circ`;
		}
		if (degrees <= 270) {
			return `${angleText}-180^\\circ=${(degrees - 180).toFixed(0)}^\\circ`;
		}
		return `360^\\circ-${angleText}=${(360 - degrees).toFixed(0)}^\\circ`;
	}

	function buildAngleArcPath(
		startAngle: number,
		sweepAngle: number,
		radius: number,
		centerX: number,
		centerY: number
	) {
		if (Math.abs(sweepAngle) < 0.02) {
			return '';
		}

		const steps = Math.max(10, Math.ceil(Math.abs(sweepAngle) / (Math.PI / 18)));
		let path = `M ${centerX + Math.cos(startAngle) * radius} ${centerY - Math.sin(startAngle) * radius}`;

		for (let step = 1; step <= steps; step += 1) {
			const t = startAngle + (sweepAngle * step) / steps;
			const px = centerX + Math.cos(t) * radius;
			const py = centerY - Math.sin(t) * radius;
			path += ` L ${px} ${py}`;
		}

		return path;
	}
</script>

<div class="min-w-0 space-y-4 select-none">
	<div class="grid min-w-0 gap-3 sm:grid-cols-[auto_auto_minmax(0,1fr)]">
		<p class="w-fit min-w-[8rem] justify-self-start rounded-xl border border-border/70 bg-background/80 pl-2 pr-1.5 py-2 text-sm text-muted-foreground">
			Angle:
			<MathExpression
				math={angleSummary}
				class="mt-1 block w-full max-w-full overflow-x-auto whitespace-nowrap font-semibold text-foreground lg:mt-0 lg:ml-1 lg:inline-block lg:w-auto lg:align-middle [&_.katex]:whitespace-nowrap"
			/>
		</p>
		<p class="w-fit min-w-[10rem] justify-self-start rounded-xl border border-border/70 bg-background/80 pl-2 pr-1.5 py-2 text-sm text-muted-foreground">
			Point:
			<span
				class="mt-1 block max-w-full overflow-x-auto whitespace-nowrap font-semibold text-foreground lg:mt-0 lg:ml-1 lg:inline-block lg:max-w-none lg:align-middle"
			>
				{coordinateLabel}
			</span>
		</p>
		<p class="min-w-0 rounded-xl border border-border/70 bg-background/80 pl-2 pr-1.5 py-2 text-sm text-muted-foreground sm:pr-2 lg:pr-3">
			Identity:
			<MathExpression
				math={identityNumericalSummary}
				class="mt-1 block w-full max-w-full overflow-x-auto whitespace-nowrap font-semibold text-foreground lg:mt-0 lg:ml-1 lg:inline-block lg:w-auto lg:align-middle [&_.katex]:whitespace-nowrap"
			/>
		</p>
	</div>

	<svg
		bind:this={plotSvg}
		viewBox={`0 0 ${PLOT_SIZE} ${PLOT_SIZE}`}
		class="w-full rounded-xl border border-border/70 bg-white select-none touch-none"
		role="img"
		aria-label="Unit circle with draggable point, x and y legs, and coordinate labels"
		onpointerdown={handlePlotPointerDown}
		onpointermove={handlePlotPointerMove}
		onpointerup={stopDrag}
		onpointercancel={stopDrag}
	>
		<rect x={PLOT_PADDING} y={PLOT_PADDING} width={PLOT_INNER_SIZE} height={PLOT_INNER_SIZE} fill="white" />

		{#each gridTicks as tick (tick)}
			<line
				x1={toScreenX(tick)}
				y1={PLOT_PADDING}
				x2={toScreenX(tick)}
				y2={PLOT_SIZE - PLOT_PADDING}
				stroke={tick === 0 ? '#94a3b8' : '#e2e8f0'}
				stroke-width={tick === 0 ? 1.3 : 1}
			/>
			<line
				x1={PLOT_PADDING}
				y1={toScreenY(tick)}
				x2={PLOT_SIZE - PLOT_PADDING}
				y2={toScreenY(tick)}
				stroke={tick === 0 ? '#94a3b8' : '#e2e8f0'}
				stroke-width={tick === 0 ? 1.3 : 1}
			/>
		{/each}

		<circle
			cx={originScreenX}
			cy={originScreenY}
			r={unitRadiusPx}
			fill="rgba(14, 116, 144, 0.06)"
			stroke="#0f766e"
			stroke-width="2.2"
		/>

		<line
			x1={originScreenX}
			y1={originScreenY}
			x2={pointScreenX}
			y2={pointScreenY}
			stroke="#0f766e"
			stroke-width="2.2"
		/>
		{#if thetaArcPath}
			<path d={thetaArcPath} fill="none" stroke="#ea580c" stroke-width="2.2" stroke-linecap="round" />
			<text x={thetaLabelX} y={thetaLabelY} text-anchor="middle" class="fill-orange-600 text-sm font-semibold">
				θ
			</text>
		{/if}
		<line
			x1={originScreenX}
			y1={originScreenY}
			x2={pointScreenX}
			y2={originScreenY}
			stroke="#2563eb"
			stroke-width="2"
			stroke-dasharray="5 4"
		/>
		<line
			x1={pointScreenX}
			y1={originScreenY}
			x2={pointScreenX}
			y2={pointScreenY}
			stroke="#2563eb"
			stroke-width="2"
			stroke-dasharray="5 4"
		/>

		<circle cx={originScreenX} cy={originScreenY} r="4.5" fill="#0f172a" />
		<circle cx={pointScreenX} cy={pointScreenY} r="7" fill="#f59e0b" stroke="#92400e" stroke-width="2" />

		<text x={xLabelX} y={xLabelY} text-anchor="middle" class="fill-blue-700 text-xs font-semibold">x</text>
		<text x={yLabelX} y={yLabelY} text-anchor={yLabelAnchor} class="fill-blue-700 text-xs font-semibold">y</text>
		<text
			x={radiusLabelX}
			y={radiusLabelY}
			text-anchor="middle"
			stroke="white"
			stroke-width="3"
			paint-order="stroke"
			stroke-linejoin="round"
			class="fill-teal-700 text-xs font-semibold"
		>
			1
		</text>
		<text x={pointLabelX} y={pointLabelY} text-anchor={pointLabelAnchor} class="fill-slate-800 text-xs font-semibold">
			{coordinateLabel}
		</text>

		{#each majorTicks as tick (tick)}
			<text
				x={toScreenX(tick)}
				y={PLOT_SIZE - PLOT_PADDING + 14}
				text-anchor="middle"
				class="fill-slate-500 text-[10px] font-medium"
			>
				{tick}
			</text>
			<text
				x={PLOT_PADDING - 12}
				y={toScreenY(tick) + 3}
				text-anchor="middle"
				class="fill-slate-500 text-[10px] font-medium"
			>
				{tick}
			</text>
		{/each}
	</svg>

	<p class="text-xs text-muted-foreground">Drag the orange point around the unit circle.</p>
</div>
