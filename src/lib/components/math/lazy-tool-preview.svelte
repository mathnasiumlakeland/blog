<script module lang="ts">
	const previewCache = new Map<string, string>();
</script>

<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { getInteractiveToolLoaderById } from './tool-component-map';

	type Props = {
		toolId: string;
		title: string;
	};

	type PreviewState = 'idle' | 'loading' | 'captured' | 'failed';

	let { toolId, title }: Props = $props();

	let triggerEl: HTMLDivElement | null = $state(null);
	let captureHost: HTMLDivElement | null = $state(null);

	let previewStatus: PreviewState = $state('idle');
	let imageUrl: string | null = $state(null);
	let PreviewComponent: any = $state(null);
	let captureWidth = $state(720);
	let hasTriggered = false;

	function nextFrame() {
		return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
	}

	function getRenderedArea(node: SVGElement | HTMLCanvasElement) {
		const rect = node.getBoundingClientRect();
		if (rect.width > 0 && rect.height > 0) {
			return rect.width * rect.height;
		}

		if (node instanceof HTMLCanvasElement) {
			return node.width * node.height;
		}

		const widthAttr = Number.parseFloat(node.getAttribute('width') ?? '');
		const heightAttr = Number.parseFloat(node.getAttribute('height') ?? '');
		if (Number.isFinite(widthAttr) && Number.isFinite(heightAttr) && widthAttr > 0 && heightAttr > 0) {
			return widthAttr * heightAttr;
		}

		return 0;
	}

	function pickPrimaryVisual(): SVGElement | HTMLCanvasElement | null {
		const candidates = Array.from(
			captureHost?.querySelectorAll('svg,canvas') ?? []
		) as Array<SVGElement | HTMLCanvasElement>;

		if (candidates.length === 0) {
			return null;
		}

		const scored = candidates
			.filter((node) => !node.closest('.katex'))
			.map((node) => ({ node, area: getRenderedArea(node) }))
			.sort((left, right) => right.area - left.area);

		if (scored.length === 0) {
			return null;
		}

		const primary = scored[0];
		if (primary.area >= 3000) {
			return primary.node;
		}

		return candidates[0] ?? null;
	}

	async function waitForVisual(maxWaitMs: number) {
		const startedAt = performance.now();
		while (performance.now() - startedAt < maxWaitMs) {
			const visual = pickPrimaryVisual();
			if (visual) {
				return visual;
			}
			await nextFrame();
		}

		return pickPrimaryVisual();
	}

	function captureSvg(svg: SVGElement): string | null {
		const cloned = svg.cloneNode(true) as SVGElement;
		if (!cloned.getAttribute('xmlns')) {
			cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
		}

		const xml = new XMLSerializer().serializeToString(cloned);
		return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
	}

	function captureCanvas(canvas: HTMLCanvasElement): string | null {
		if (canvas.width === 0 || canvas.height === 0) {
			return null;
		}
		return canvas.toDataURL('image/png');
	}

	async function buildFrozenPreview() {
		if (hasTriggered || imageUrl) {
			return;
		}
		hasTriggered = true;
		previewStatus = 'loading';
		captureWidth = Math.max(280, Math.round(triggerEl?.clientWidth ?? captureWidth));

		const loader = getInteractiveToolLoaderById(toolId);
		if (!loader) {
			previewStatus = 'failed';
			return;
		}

		try {
			const module = await loader();
			PreviewComponent = module.default as any;

			await tick();
			await nextFrame();
			await nextFrame();

				const visual = await waitForVisual(300);
			if (!visual) {
				throw new Error('No visual node found');
			}

			const frozenImage =
				visual instanceof HTMLCanvasElement ? captureCanvas(visual) : captureSvg(visual);

			if (!frozenImage) {
				throw new Error('Could not capture visual');
			}

			previewCache.set(toolId, frozenImage);
			imageUrl = frozenImage;
			previewStatus = 'captured';
		} catch {
			previewStatus = 'failed';
		} finally {
			PreviewComponent = null;
			await tick();
		}
	}

	onMount(() => {
		const cached = previewCache.get(toolId);
		if (cached) {
			imageUrl = cached;
			previewStatus = 'captured';
			return;
		}

		if (!triggerEl) {
			previewStatus = 'failed';
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					const first = entries.find((entry) => entry.isIntersecting);
					if (first) {
						captureWidth = Math.max(280, Math.round(first.boundingClientRect.width));
					}
					observer.disconnect();
					void buildFrozenPreview();
				}
			},
			{ rootMargin: '300px 0px' }
		);

		observer.observe(triggerEl);

		return () => {
			observer.disconnect();
		};
	});
</script>

<div bind:this={triggerEl} class="aspect-[16/9] overflow-hidden rounded-xl border border-border/70 bg-card/80">
	{#if previewStatus === 'captured' && imageUrl}
		<img src={imageUrl} alt={`${title} frozen preview`} class="h-full w-full object-cover" loading="lazy" />
	{:else if previewStatus === 'failed'}
		<div class="soft-grid relative h-full w-full overflow-hidden">
			<div
				class="absolute left-3 right-3 top-3 h-5 rounded-md border border-border/60 bg-background/55"
				aria-hidden="true"
			></div>
			<div
				class="absolute bottom-3 left-3 right-3 top-11 rounded-md border border-dashed border-border/65 bg-background/45"
				aria-hidden="true"
			></div>
			<div class="sr-only">Preview unavailable for {title}</div>
		</div>
	{:else if previewStatus === 'loading'}
		<div class="soft-grid relative h-full w-full overflow-hidden">
			<div
				class="absolute left-3 right-3 top-3 h-5 rounded-md border border-primary/30 bg-primary/10"
				aria-hidden="true"
			></div>
			<div
				class="absolute bottom-3 left-3 right-3 top-11 rounded-md border border-primary/30 bg-primary/8"
				aria-hidden="true"
			></div>
			<div class="sr-only">Loading preview for {title}</div>
		</div>
	{:else}
		<div class="soft-grid relative h-full w-full overflow-hidden">
			<div
				class="absolute left-3 right-3 top-3 h-5 rounded-md border border-border/60 bg-background/55"
				aria-hidden="true"
			></div>
			<div
				class="absolute bottom-3 left-3 right-3 top-11 rounded-md border border-border/60 bg-background/50"
				aria-hidden="true"
			></div>
			<div class="sr-only">Preview pending for {title}</div>
		</div>
	{/if}
</div>

<div class="pointer-events-none fixed -left-[200vw] top-0 opacity-0" style={`width:${captureWidth}px`} aria-hidden="true">
	{#if PreviewComponent}
		<div bind:this={captureHost}>
			<PreviewComponent />
		</div>
	{/if}
</div>
