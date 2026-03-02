<script module lang="ts">
	import type { MathToolMeta } from './tool-meta';
	import { requireInteractiveToolMetaById } from './tool-registry';

	export const toolMeta: MathToolMeta = requireInteractiveToolMetaById('pascal-triangle-modulo-explorer');
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import MathExpression from '$lib/components/math/math-expression.svelte';
	import { TOOL_BG_GRADIENT_END, TOOL_BG_GRADIENT_START } from './tool-visual-theme';

	let canvas: HTMLCanvasElement | null = null;
	let rows = $state(128);
	let modulo = $state(2);
	let dotSize = $state(2.8);
	let showZeros = $state(false);
	let inspectRow = $state(8);
	let inspectColumn = $state(4);

	const safeRows = $derived(Math.max(24, Math.min(220, Math.round(rows))));
	const safeModulo = $derived(Math.max(2, Math.min(11, Math.round(modulo))));
	const safeDotSize = $derived(Math.max(1.2, Math.min(5, dotSize)));
	const safeInspectRow = $derived(Math.max(0, Math.min(safeRows - 1, Math.round(inspectRow))));
	const safeInspectColumn = $derived(Math.max(0, Math.min(safeInspectRow, Math.round(inspectColumn))));
	const mirrorColumn = $derived(safeInspectRow - safeInspectColumn);
	const selectedValue = $derived.by(() => binomialBigInt(safeInspectRow, safeInspectColumn));
	const selectedRemainder = $derived(Number(selectedValue % BigInt(safeModulo)));
	const selectedValueText = $derived(formatBigInt(selectedValue));
	const legendEntries = $derived.by(() =>
		Array.from({ length: safeModulo }, (_, remainder) => ({
			remainder,
			color: colorForRemainder(remainder, safeModulo)
		}))
	);

	function binomialBigInt(n: number, k: number): bigint {
		if (k < 0 || k > n) {
			return 0n;
		}

		const c = Math.min(k, n - k);
		let value = 1n;
		for (let i = 1; i <= c; i += 1) {
			value = (value * BigInt(n - c + i)) / BigInt(i);
		}
		return value;
	}

	function formatBigInt(value: bigint) {
		return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	}

	function colorForRemainder(remainder: number, moduloBase: number) {
		if (remainder === 0) {
			return 'hsl(210 18% 88%)';
		}

		const ratio = remainder / Math.max(1, moduloBase - 1);
		const hue = 195 - ratio * 150;
		const lightness = 42 + ratio * 12;
		return `hsl(${hue} 74% ${lightness}%)`;
	}

	function resizeCanvas(target: HTMLCanvasElement) {
		const ratio = window.devicePixelRatio || 1;
		const { width } = target.getBoundingClientRect();
		const height = Math.max(280, Math.min(620, width * 0.72));

		target.width = Math.floor(width * ratio);
		target.height = Math.floor(height * ratio);
		target.style.height = `${height}px`;

		const context = target.getContext('2d');
		context?.setTransform(ratio, 0, 0, ratio, 0, 0);
	}

	function drawTriangle(rowCount: number, moduloBase: number, size: number, includeZeros: boolean) {
		if (!canvas) {
			return;
		}

		const context = canvas.getContext('2d');
		if (!context) {
			return;
		}

		const width = canvas.clientWidth;
		const height = canvas.clientHeight;
		const padding = 18;
		const stepY = (height - padding * 2) / Math.max(1, rowCount - 1);
		const stepX = (width - padding * 2) / Math.max(2, rowCount + 1);
		const radius = Math.min(size, stepX * 0.44, stepY * 0.44);

		context.clearRect(0, 0, width, height);
		const background = context.createLinearGradient(0, 0, width, height);
		background.addColorStop(0, TOOL_BG_GRADIENT_START);
		background.addColorStop(1, TOOL_BG_GRADIENT_END);
		context.fillStyle = background;
		context.fillRect(0, 0, width, height);
		context.strokeStyle = 'rgba(148,163,184,0.45)';
		context.lineWidth = 1;
		context.strokeRect(0.5, 0.5, width - 1, height - 1);

		let currentRow: number[] = [1];

		for (let n = 0; n < rowCount; n += 1) {
			const y = padding + n * stepY;
			const rowWidth = n * stepX;
			const startX = width / 2 - rowWidth / 2;

			for (let k = 0; k <= n; k += 1) {
				const remainder = currentRow[k];
				if (remainder === 0 && !includeZeros) {
					continue;
				}

				const x = startX + k * stepX;
				context.fillStyle = colorForRemainder(remainder, moduloBase);
				context.beginPath();
				context.arc(x, y, radius, 0, Math.PI * 2);
				context.fill();
			}

			const nextRow = Array.from({ length: n + 2 }, () => 0);
			nextRow[0] = 1 % moduloBase;
			nextRow[n + 1] = 1 % moduloBase;
			for (let k = 1; k <= n; k += 1) {
				nextRow[k] = (currentRow[k - 1] + currentRow[k]) % moduloBase;
			}
			currentRow = nextRow;
		}
	}

	function renderTriangle() {
		drawTriangle(safeRows, safeModulo, safeDotSize, showZeros);
	}

	onMount(() => {
		if (!canvas) {
			return;
		}

		const onResize = () => {
			if (!canvas) {
				return;
			}
			resizeCanvas(canvas);
			renderTriangle();
		};

		const resizeObserver = new ResizeObserver(onResize);
		resizeObserver.observe(canvas);

		onResize();

		return () => {
			resizeObserver.disconnect();
		};
	});
</script>

<div class="space-y-4">
	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
		<div class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Recurrence rule:
			<MathExpression
				math={`\\binom{n}{k}=\\binom{n-1}{k-1}+\\binom{n-1}{k}`}
				class="ml-1 font-semibold text-foreground"
			/>
		</div>
		<div class="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-sm text-muted-foreground">
			Selected entry:
			<MathExpression
				math={`\\binom{${safeInspectRow}}{${safeInspectColumn}}\\bmod ${safeModulo}=${selectedRemainder}`}
				class="ml-1 font-semibold text-foreground"
			/>
			<span class="ml-1 text-foreground">(value: {selectedValueText})</span>
		</div>
	</div>

	<canvas
		bind:this={canvas}
		class="w-full rounded-xl border border-border/70 bg-card/70"
		aria-label="Pascal triangle modulo plot"
	></canvas>

	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			Rows: {safeRows}
			<input
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
				type="range"
				min="24"
				max="220"
				step="1"
				bind:value={rows}
				oninput={renderTriangle}
			/>
		</label>

		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			Modulo: {safeModulo}
			<input
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
				type="range"
				min="2"
				max="11"
				step="1"
				bind:value={modulo}
				oninput={renderTriangle}
			/>
		</label>

		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			Dot size: {safeDotSize.toFixed(1)} px
			<input
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
				type="range"
				min="1.2"
				max="5"
				step="0.1"
				bind:value={dotSize}
				oninput={renderTriangle}
			/>
		</label>

		<label class="rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-xs font-medium text-muted-foreground">
			<span class="text-sm text-foreground">Show remainder 0</span>
			<div class="mt-2 flex items-center gap-2">
				<input type="checkbox" bind:checked={showZeros} class="size-4 accent-primary" onchange={renderTriangle} />
				<span class="leading-tight">Display multiples of {safeModulo} in light gray.</span>
			</div>
		</label>

		<div class="rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
			<p class="font-medium text-foreground">Symmetry check</p>
			<p class="mt-1">
				<MathExpression
					math={`\\binom{${safeInspectRow}}{${safeInspectColumn}}=\\binom{${safeInspectRow}}{${mirrorColumn}}`}
					class="font-semibold text-foreground"
				/>
			</p>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			Inspect row n: {safeInspectRow}
			<input
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
				type="range"
				min="0"
				max={Math.max(0, safeRows - 1)}
				step="1"
				bind:value={inspectRow}
			/>
		</label>

		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			Inspect column k: {safeInspectColumn}
			<input
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
				type="range"
				min="0"
				max={Math.max(0, safeInspectRow)}
				step="1"
				bind:value={inspectColumn}
			/>
		</label>
	</div>

	<div class="rounded-lg border border-border/70 bg-background/70 p-3">
		<p class="text-xs font-medium text-muted-foreground">Remainder legend (mod {safeModulo})</p>
		<div class="mt-2 flex flex-wrap gap-2">
			{#each legendEntries as entry (entry.remainder)}
				<div class="flex items-center gap-1.5 rounded-md border border-border/70 bg-background/90 px-2 py-1 text-xs text-foreground">
					<span
						class="size-3 rounded-full border border-border/60"
						style={`background:${entry.color}`}
						aria-hidden="true"
					></span>
					r = {entry.remainder}
				</div>
			{/each}
		</div>
	</div>
</div>
