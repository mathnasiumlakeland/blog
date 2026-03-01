<script module lang="ts">
	import type { MathToolMeta } from './tool-meta';

	export const toolMeta: MathToolMeta = {
		id: 'lissajous-canvas',
		title: 'Lissajous Pattern Lab',
		description: 'Animate Lissajous curves to connect frequency ratios with visible symmetry.',
		inputs: 'Frequency A, frequency B, phase, speed, and play/pause state.',
		outputs: 'A continuously drawn curve that changes shape as trigonometric parameters change.',
		useCase: 'Use for algebra and trigonometry discussions on periodic functions and parameter effects.',
		tags: ['algebra', 'trigonometry', 'patterns', 'animation', 'functions'],
		audience: ['students', 'instructors'],
		kind: 'interactive'
	};
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';

	let canvas: HTMLCanvasElement | null = null;
	let isPlaying = $state(true);
	let speed = $state(1);
	let frequencyA = $state(3);
	let frequencyB = $state(2);
	let phase = $state(Math.PI / 2);

	let frame = 0;
	let raf = 0;
	let canvasWidth = 0;
	let canvasHeight = 0;

	const TAU = Math.PI * 2;

	function resizeCanvas(target: HTMLCanvasElement) {
		const ratio = window.devicePixelRatio || 1;
		const { width } = target.getBoundingClientRect();
		const height = width * 0.7;
		canvasWidth = width;
		canvasHeight = height;
		target.width = Math.ceil(width * ratio);
		target.height = Math.ceil(height * ratio);
		target.style.height = `${height}px`;

		const context = target.getContext('2d');
		context?.setTransform(ratio, 0, 0, ratio, 0, 0);
	}

	function draw(context: CanvasRenderingContext2D, width: number, height: number) {
		context.clearRect(0, 0, width, height);

		const gradient = context.createLinearGradient(0, 0, width, height);
		gradient.addColorStop(0, 'rgba(15, 23, 42, 0.05)');
		gradient.addColorStop(1, 'rgba(20, 184, 166, 0.08)');
		context.fillStyle = gradient;
		context.fillRect(0, 0, width, height);

		context.save();
		context.translate(width / 2, height / 2);

		const radius = Math.min(width, height) * 0.38;
		const points = 750;

		context.beginPath();
		for (let i = 0; i <= points; i += 1) {
			const t = (i / points) * TAU * 2;
			const x = radius * Math.sin(frequencyA * t + phase + frame * 0.8);
			const y = radius * Math.sin(frequencyB * t + frame);

			if (i === 0) {
				context.moveTo(x, y);
			} else {
				context.lineTo(x, y);
			}
		}

		context.lineWidth = 2;
		context.strokeStyle = 'rgba(13, 148, 136, 0.95)';
		context.shadowBlur = 18;
		context.shadowColor = 'rgba(14, 116, 144, 0.35)';
		context.stroke();
		context.restore();
	}

	onMount(() => {
		if (!canvas) {
			return;
		}

		const context = canvas.getContext('2d');
		if (!context) {
			return;
		}

		const render = () => {
			const width = canvasWidth || canvas?.getBoundingClientRect().width || 0;
			const height = canvasHeight || canvas?.getBoundingClientRect().height || 0;
			draw(context, width, height);
		};

		const animate = () => {
			if (isPlaying) {
				frame += 0.008 * speed;
				render();
			}
			raf = requestAnimationFrame(animate);
		};

		const onResize = () => {
			if (!canvas) {
				return;
			}
			resizeCanvas(canvas);
			render();
		};

		onResize();
		animate();
		window.addEventListener('resize', onResize);

		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener('resize', onResize);
		};
	});

	$effect(() => {
		if (!canvas) {
			return;
		}

		const context = canvas.getContext('2d');
		if (!context) {
			return;
		}

		const width = canvasWidth || canvas.getBoundingClientRect().width;
		const height = canvasHeight || canvas.getBoundingClientRect().height;
		draw(context, width, height);
	});
</script>

<div class="space-y-4">
	<canvas bind:this={canvas} class="block w-full rounded-xl border border-border/70 bg-card/60"></canvas>

	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			Frequency A: {frequencyA}
			<input
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
				type="range"
				min="1"
				max="9"
				step="1"
				bind:value={frequencyA}
			/>
		</label>

		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			Frequency B: {frequencyB}
			<input
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
				type="range"
				min="1"
				max="9"
				step="1"
				bind:value={frequencyB}
			/>
		</label>

		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			Phase: {phase.toFixed(2)}
			<input
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
				type="range"
				min="0"
				max={Math.PI * 2}
				step="0.01"
				bind:value={phase}
			/>
		</label>

		<label class="space-y-1 text-xs font-medium text-muted-foreground">
			Speed: {speed.toFixed(1)}x
			<input
				class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
				type="range"
				min="0.2"
				max="2.4"
				step="0.1"
				bind:value={speed}
			/>
		</label>
	</div>

	<Button
		variant="outline"
		class="w-full hover:!bg-card/82 hover:!text-foreground hover:!shadow-none"
		onclick={() => (isPlaying = !isPlaying)}
	>
		{isPlaying ? 'Pause motion' : 'Resume motion'}
	</Button>
</div>
