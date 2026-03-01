<script module lang="ts">
	import type { MathToolMeta } from './tool-meta';

	export const toolMeta: MathToolMeta = {
		id: 'pascal-modulo-canvas',
		title: 'Pascal Triangle Modulo Patterns',
		description: 'Plot Pascal triangle entries modulo k to reveal repeating and fractal-like structure.',
		inputs: 'Row count, modulo base, and dot size.',
		outputs: 'Canvas plot of nonzero modulo entries colored by remainder value.',
		useCase: 'Use for number patterns, modular arithmetic, and pattern recognition activities.',
		tags: ['number-theory', 'modular-arithmetic', 'patterns', 'pascal-triangle', 'combinatorics'],
		audience: ['students', 'instructors'],
		kind: 'interactive'
	};
</script>

<script lang="ts">
	import { onMount } from 'svelte';

	let canvas: HTMLCanvasElement | null = null;
	let rows = $state(120);
	let modulo = $state(2);
	let dotSize = $state(3);
	const safeRows = $derived(Math.max(24, Math.min(220, Math.round(rows))));
	const safeModulo = $derived(Math.max(2, Math.min(11, Math.round(modulo))));
	const safeDotSize = $derived(Math.max(1.5, Math.min(5, dotSize)));

	function resize(target: HTMLCanvasElement) {
		const ratio = window.devicePixelRatio || 1;
		const { width } = target.getBoundingClientRect();
		const height = Math.min(620, width * 0.95);

		target.width = Math.floor(width * ratio);
		target.height = Math.floor(height * ratio);
		target.style.height = `${height}px`;

		const context = target.getContext('2d');
		context?.setTransform(ratio, 0, 0, ratio, 0, 0);
	}

	function drawTriangle(rowCount: number, moduloBase: number, size: number) {
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

		context.clearRect(0, 0, width, height);
		context.fillStyle = 'rgba(255,255,255,0.9)';
		context.fillRect(0, 0, width, height);

		let currentRow: number[] = [1];

		for (let n = 0; n < rowCount; n += 1) {
			const y = padding + n * stepY;
			const rowWidth = n * stepX;
			const startX = width / 2 - rowWidth / 2;

			for (let k = 0; k <= n; k += 1) {
				const value = currentRow[k] % moduloBase;
				if (value === 0) {
					continue;
				}

				const x = startX + k * stepX;
				const ratio = value / moduloBase;
				const hue = 194 - ratio * 74;
				const lightness = 38 + ratio * 24;
				context.fillStyle = `hsl(${hue} 72% ${lightness}%)`;
				context.beginPath();
				context.arc(x, y, size, 0, Math.PI * 2);
				context.fill();
			}

			const nextRow = Array.from({ length: n + 2 }, () => 0);
			nextRow[0] = 1;
			nextRow[n + 1] = 1;
			for (let k = 1; k <= n; k += 1) {
				nextRow[k] = (currentRow[k - 1] + currentRow[k]) % moduloBase;
			}
			currentRow = nextRow;
		}
	}

	onMount(() => {
		if (!canvas) {
			return;
		}

		const onResize = () => {
			if (!canvas) {
				return;
			}
			resize(canvas);
			drawTriangle(safeRows, safeModulo, safeDotSize);
		};

		onResize();
		window.addEventListener('resize', onResize);

		return () => {
			window.removeEventListener('resize', onResize);
		};
	});

	$effect(() => {
		safeRows;
		safeModulo;
		safeDotSize;
		drawTriangle(safeRows, safeModulo, safeDotSize);
	});
</script>

<div class="space-y-4">
	<canvas bind:this={canvas} class="w-full rounded-xl border border-border/70 bg-card/70"></canvas>

	<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			Rows: {safeRows}
			<input
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
				type="range"
				min="24"
				max="220"
				step="1"
				bind:value={rows}
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
			/>
		</label>

		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			Dot size: {safeDotSize.toFixed(1)}
			<input
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
				type="range"
				min="1.5"
				max="5"
				step="0.1"
				bind:value={dotSize}
			/>
		</label>
	</div>
</div>
