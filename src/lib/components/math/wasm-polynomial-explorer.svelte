<script lang="ts">
	import { onMount } from 'svelte';
	import { Badge } from '$lib/components/ui/badge';

	type WasmExports = {
		poly: (x: number) => number;
		dpoly: (x: number) => number;
		iterate_newton: (x0: number, iterations: number) => number;
	};

	let canvas: HTMLCanvasElement | null = null;
	let status = $state<'loading' | 'ready' | 'error'>('loading');
	let startX = $state(0.85);
	let iterations = $state(6);

	let wasm: WasmExports | null = null;

	const domainMin = -2.4;
	const domainMax = 2.4;
	const rangeMin = -3.4;
	const rangeMax = 3.4;
	const epsilon = 0.0000001;

	const polyFallback = (x: number) => x * x * x - 2 * x + 1;
	const dPolyFallback = (x: number) => 3 * x * x - 2;

	function poly(x: number) {
		return wasm ? wasm.poly(x) : polyFallback(x);
	}

	function dpoly(x: number) {
		return wasm ? wasm.dpoly(x) : dPolyFallback(x);
	}

	function iterateNewton(initial: number, count: number) {
		if (wasm) {
			return wasm.iterate_newton(initial, count);
		}

		let x = initial;
		for (let i = 0; i < count; i += 1) {
			const slope = dpoly(x);
			if (Math.abs(slope) < epsilon) {
				break;
			}
			x -= poly(x) / slope;
		}
		return x;
	}

	const approximation = $derived(iterateNewton(startX, iterations));
	const residual = $derived(Math.abs(poly(approximation)));

	function resize(target: HTMLCanvasElement) {
		const ratio = window.devicePixelRatio || 1;
		const { width } = target.getBoundingClientRect();
		const height = Math.min(500, width * 0.62);

		target.width = Math.floor(width * ratio);
		target.height = Math.floor(height * ratio);
		target.style.height = `${height}px`;

		const context = target.getContext('2d');
		context?.setTransform(ratio, 0, 0, ratio, 0, 0);
	}

	function plot(
		context: CanvasRenderingContext2D,
		width: number,
		height: number,
		padding: number,
		x: number,
		y: number
	) {
		const px = padding + ((x - domainMin) / (domainMax - domainMin)) * (width - padding * 2);
		const py = padding + (1 - (y - rangeMin) / (rangeMax - rangeMin)) * (height - padding * 2);
		return { x: px, y: py };
	}

	function draw() {
		if (!canvas) {
			return;
		}

		const context = canvas.getContext('2d');
		if (!context) {
			return;
		}

		const width = canvas.clientWidth;
		const height = canvas.clientHeight;
		const padding = 28;

		context.clearRect(0, 0, width, height);

		const bg = context.createLinearGradient(0, 0, width, height);
		bg.addColorStop(0, 'rgba(255, 255, 255, 0.92)');
		bg.addColorStop(1, 'rgba(240, 253, 250, 0.96)');
		context.fillStyle = bg;
		context.fillRect(0, 0, width, height);

		context.strokeStyle = 'rgba(15, 23, 42, 0.18)';
		context.lineWidth = 1;
		context.beginPath();
		const xAxisStart = plot(context, width, height, padding, domainMin, 0);
		const xAxisEnd = plot(context, width, height, padding, domainMax, 0);
		context.moveTo(xAxisStart.x, xAxisStart.y);
		context.lineTo(xAxisEnd.x, xAxisEnd.y);

		const yAxisStart = plot(context, width, height, padding, 0, rangeMin);
		const yAxisEnd = plot(context, width, height, padding, 0, rangeMax);
		context.moveTo(yAxisStart.x, yAxisStart.y);
		context.lineTo(yAxisEnd.x, yAxisEnd.y);
		context.stroke();

		context.beginPath();
		const samples = 480;
		for (let i = 0; i <= samples; i += 1) {
			const x = domainMin + (i / samples) * (domainMax - domainMin);
			const y = poly(x);
			const point = plot(context, width, height, padding, x, y);
			if (i === 0) {
				context.moveTo(point.x, point.y);
			} else {
				context.lineTo(point.x, point.y);
			}
		}
		context.strokeStyle = 'rgba(15, 118, 110, 0.95)';
		context.lineWidth = 2.5;
		context.stroke();

		let xCurrent = startX;
		for (let i = 0; i < iterations; i += 1) {
			const yCurrent = poly(xCurrent);
			const slope = dpoly(xCurrent);
			if (Math.abs(slope) < epsilon) {
				break;
			}

			const xNext = xCurrent - yCurrent / slope;

			const onCurve = plot(context, width, height, padding, xCurrent, yCurrent);
			const onAxisCurrent = plot(context, width, height, padding, xCurrent, 0);
			const onAxisNext = plot(context, width, height, padding, xNext, 0);

			context.strokeStyle = 'rgba(59, 130, 246, 0.7)';
			context.lineWidth = 1.2;
			context.beginPath();
			context.moveTo(onAxisCurrent.x, onAxisCurrent.y);
			context.lineTo(onCurve.x, onCurve.y);
			context.lineTo(onAxisNext.x, onAxisNext.y);
			context.stroke();

			context.fillStyle = 'rgba(30, 64, 175, 0.95)';
			context.beginPath();
			context.arc(onCurve.x, onCurve.y, 2.6, 0, Math.PI * 2);
			context.fill();

			xCurrent = xNext;
		}

		const rootPoint = plot(context, width, height, padding, approximation, 0);
		context.fillStyle = 'rgba(217, 119, 6, 0.96)';
		context.beginPath();
		context.arc(rootPoint.x, rootPoint.y, 4.6, 0, Math.PI * 2);
		context.fill();
	}

	onMount(() => {
		if (!canvas) {
			return;
		}

		const boot = async () => {
			try {
				const response = await fetch('/wasm/polynomial.wasm');
				const bytes = await response.arrayBuffer();
				const result = await WebAssembly.instantiate(bytes, {});
				wasm = result.instance.exports as unknown as WasmExports;
				status = 'ready';
			} catch {
				status = 'error';
			}
			draw();
		};

		const onResize = () => {
			if (!canvas) {
				return;
			}
			resize(canvas);
			draw();
		};

		onResize();
		void boot();
		window.addEventListener('resize', onResize);

		return () => {
			window.removeEventListener('resize', onResize);
		};
	});

	$effect(() => {
		startX;
		iterations;
		draw();
	});
</script>

<div class="space-y-4">
	<div class="flex flex-wrap items-center gap-2">
		<Badge variant="outline">Polynomial: x^3 - 2x + 1</Badge>
		<Badge variant={status === 'ready' ? 'default' : 'secondary'}>
			{status === 'ready' ? 'WASM active' : status === 'loading' ? 'Loading WASM...' : 'Fallback JS mode'}
		</Badge>
	</div>

	<canvas bind:this={canvas} class="w-full rounded-xl border border-border/70 bg-card/70"></canvas>

	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			Initial guess: {startX.toFixed(2)}
			<input
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
				type="range"
				min="-2.2"
				max="2.2"
				step="0.01"
				bind:value={startX}
			/>
		</label>

		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			Iterations: {iterations}
			<input
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
				type="range"
				min="1"
				max="12"
				step="1"
				bind:value={iterations}
			/>
		</label>
	</div>

	<div class="grid grid-cols-1 gap-3 text-sm text-muted-foreground sm:grid-cols-2">
		<p class="rounded-lg border border-border/70 bg-background/80 px-3 py-2">
			Estimated root: <span class="font-semibold text-foreground">{approximation.toFixed(7)}</span>
		</p>
		<p class="rounded-lg border border-border/70 bg-background/80 px-3 py-2">
			Residual |f(x)|: <span class="font-semibold text-foreground">{residual.toExponential(2)}</span>
		</p>
	</div>
</div>
