<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import { base, resolve } from '$app/paths';
	import { page } from '$app/state';
	import { BookOpenText, Calculator, ExternalLink, Moon, Sigma, Sun } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';

	let { children } = $props();
	let isDark = $state(false);
	let hideHeader = $state(false);
	let scrollProgress = $state(0);
	let headerHeight = $state(0);
	let headerElement: HTMLElement | undefined = $state();
	let lastScrollY = 0;
	let upwardScrollDistance = 0;
	let downwardScrollDistance = 0;
	let pendingScrollY = 0;
	let scrollFrameId: number | undefined;
	const postsPath = resolve('/posts');
	const toolsPath = resolve('/tools');
	const currentPath = $derived(page.url.pathname);
	const normalizedCurrentPath = $derived(
		currentPath !== '/' ? currentPath.replace(/\/+$/, '') : currentPath
	);
	const onPostsPage = $derived(currentPath === postsPath || currentPath.startsWith(`${postsPath}/`));
	const onToolsPage = $derived(currentPath === toolsPath || currentPath.startsWith(`${toolsPath}/`));
	const onPostDetailPage = $derived(
		normalizedCurrentPath.startsWith(`${postsPath}/`) &&
			normalizedCurrentPath.slice(postsPath.length + 1).length > 0
	);
	const headerSpacerHeight = $derived(onPostDetailPage && hideHeader ? 8 : headerHeight);
	const showProgressChrome = $derived(onPostDetailPage && hideHeader);

	const activeNavClass = 'gap-1.5 px-2.5 hover:shadow-none sm:px-3';
	const inactiveNavClass =
		'gap-1.5 px-2.5 hover:!bg-card/82 hover:!text-foreground hover:!shadow-none sm:px-3';
	const hideThreshold = 40;
	const revealThreshold = 1000;

	function updateScrollProgress(scrollY: number) {
		const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
		if (maxScroll <= 0) {
			if (scrollProgress !== 0) scrollProgress = 0;
			return;
		}

		const nextProgress = Math.max(0, Math.min(100, (scrollY / maxScroll) * 100));
		if (Math.abs(nextProgress - scrollProgress) >= 0.2) {
			scrollProgress = nextProgress;
		}
	}

	function applyScrollState(scrollY: number) {
		updateScrollProgress(scrollY);

		if (!onPostDetailPage) {
			hideHeader = false;
			upwardScrollDistance = 0;
			downwardScrollDistance = 0;
			lastScrollY = scrollY;
			return;
		}

		if (scrollY <= 16) {
			hideHeader = false;
			upwardScrollDistance = 0;
			downwardScrollDistance = 0;
			lastScrollY = scrollY;
			return;
		}

		const delta = scrollY - lastScrollY;
		if (Math.abs(delta) < 2) {
			lastScrollY = scrollY;
			return;
		}

		if (delta > 0) {
			upwardScrollDistance = 0;
			downwardScrollDistance += delta;
			if (!hideHeader && scrollY > 120 && downwardScrollDistance >= hideThreshold) {
				hideHeader = true;
				downwardScrollDistance = 0;
			}
		} else {
			downwardScrollDistance = 0;
			upwardScrollDistance += Math.abs(delta);
			if (hideHeader && upwardScrollDistance >= revealThreshold) {
				hideHeader = false;
				upwardScrollDistance = 0;
			}
		}

		lastScrollY = scrollY;
	}

	function handleScroll() {
		pendingScrollY = Math.max(0, window.scrollY);
		if (scrollFrameId !== undefined) return;

		scrollFrameId = window.requestAnimationFrame(() => {
			scrollFrameId = undefined;
			applyScrollState(pendingScrollY);
		});
	}

	function applyTheme(nextIsDark: boolean) {
		document.documentElement.classList.toggle('dark', nextIsDark);
		isDark = nextIsDark;
	}

	function toggleTheme() {
		const nextIsDark = !isDark;
		applyTheme(nextIsDark);
		localStorage.setItem('theme', nextIsDark ? 'dark' : 'light');
	}

	$effect(() => {
		if (!headerElement || typeof ResizeObserver === 'undefined') return;

		const observer = new ResizeObserver((entries) => {
			headerHeight = entries[0]?.contentRect.height ?? headerElement?.offsetHeight ?? 0;
		});

		observer.observe(headerElement);
		headerHeight = headerElement.offsetHeight;

		return () => observer.disconnect();
	});

	$effect(() => {
		if (typeof window === 'undefined') return;
		onPostDetailPage;

		hideHeader = false;
		upwardScrollDistance = 0;
		downwardScrollDistance = 0;
		lastScrollY = Math.max(0, window.scrollY);
		updateScrollProgress(lastScrollY);
	});

	onMount(() => {
		const savedTheme = localStorage.getItem('theme');
		if (savedTheme === 'dark' || savedTheme === 'light') {
			applyTheme(savedTheme === 'dark');
		} else {
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			applyTheme(prefersDark);
		}

		lastScrollY = Math.max(0, window.scrollY);
		upwardScrollDistance = 0;
		downwardScrollDistance = 0;
		updateScrollProgress(lastScrollY);
		window.addEventListener('scroll', handleScroll, { passive: true });

		return () => {
			window.removeEventListener('scroll', handleScroll);
			if (scrollFrameId !== undefined) {
				window.cancelAnimationFrame(scrollFrameId);
			}
		};
	});
</script>

<svelte:head>
	<title>Mathnasium Pro</title>
	<link rel="icon" href={`${base}/sigma2.svg`} type="image/svg+xml" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta
		name="description"
		content="Mathnasium Lakeland Highlands' math blog. Explore math topics, resources, and more."
	/>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Manrope:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="relative flex min-h-screen flex-col">
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div class="math-orb -left-20 top-24 size-80 bg-gradient-to-br from-cyan-300/60 to-teal-300/30"></div>
		<div
			class="math-orb -right-24 top-96 size-96 bg-gradient-to-br from-sky-300/45 to-blue-300/30 [animation-delay:1.8s]"
		></div>
	</div>

	<header
		bind:this={headerElement}
		class={`fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-background/82 backdrop-blur-sm sm:backdrop-blur-md transition-transform duration-300 ease-out will-change-transform ${showProgressChrome ? '-translate-y-full' : 'translate-y-0'}`}
	>
		<div class="mx-auto flex max-w-6xl items-center justify-between px-3 py-3 sm:px-6 sm:py-4 lg:px-8">
			<a
				href={resolve('/')}
				class="group inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-2.5 py-1.5 text-sm font-semibold shadow-sm transition hover:bg-card/82 sm:gap-2.5 sm:px-3"
			>
				<Sigma class="size-4 text-primary" />
				<span class="sm:hidden">Mathnasium Pro</span>
				<span class="hidden sm:inline">Mathnasium Pro</span>
			</a>

			<div class="flex items-center gap-2">
				<Button
					size="icon-sm"
					variant="outline"
					class="hover:!bg-card/82 hover:!text-foreground hover:!shadow-none"
					onclick={toggleTheme}
					aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
					title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
				>
					{#if isDark}
						<Moon class="size-4" />
					{:else}
						<Sun class="size-4" />
					{/if}
				</Button>

				<Button
					href={postsPath}
					size="sm"
					variant={onPostsPage ? 'default' : 'outline'}
					class={onPostsPage ? activeNavClass : inactiveNavClass}
					aria-current={onPostsPage ? 'page' : undefined}
				>
					<BookOpenText class="size-4" />
					<span class="hidden sm:inline">Explore</span>
				</Button>
				<Button
					href={toolsPath}
					size="sm"
					variant={onToolsPage ? 'default' : 'outline'}
					class={onToolsPage ? activeNavClass : inactiveNavClass}
					aria-current={onToolsPage ? 'page' : undefined}
				>
					<Calculator class="size-4" />
					<span class="hidden sm:inline">Tools</span>
				</Button>
				<Button
					href="https://www.mathnasium.com/math-centers/lakelandhighlands"
					size="sm"
					variant="outline"
					class="gap-1.5 px-2.5 hover:!bg-card/82 hover:!text-foreground hover:!shadow-none sm:px-3"
					target="_blank"
					rel="noopener noreferrer"
				>
					<ExternalLink class="size-4" />
					<span class="hidden sm:inline">Center</span>
				</Button>
			</div>
		</div>
	</header>
	<div
		class="relative z-40 transition-[height] duration-300 ease-out"
		style={`height: ${headerSpacerHeight}px;`}
	>
		<div
			class={`pointer-events-none fixed inset-x-0 top-0 transition-[transform,opacity] duration-300 ease-out will-change-transform ${showProgressChrome ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`}
		>
			<div class="h-1.5 overflow-hidden border-b border-border/70 bg-background/82">
				<div
					class="h-full origin-left bg-primary/90 transition-transform duration-150 ease-out will-change-transform"
					style={`transform: scaleX(${scrollProgress / 100});`}
				></div>
			</div>
		</div>
	</div>

	<main
		class="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-3 pb-14 pt-6 sm:px-6 sm:pb-16 sm:pt-10 lg:px-8"
	>
		{@render children()}
	</main>

	<footer class="border-t border-border/70 bg-background/75 py-7 backdrop-blur-sm">
		<div
			class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-center text-sm text-muted-foreground sm:flex-row sm:items-center sm:px-6 sm:text-left lg:px-8"
		>
			<p>
				Schedule a <a
					href="https://www.mathnasium.com/math-centers/lakelandhighlands"
					target="_blank"
					rel="noopener noreferrer"
					class="font-medium text-primary underline-offset-4 hover:underline"
				>free assessment</a> for your child today.
			</p>
			<p class="text-xs text-foreground/70">Made by Mathnasium Lakeland Highlands</p>
		</div>
	</footer>
</div>
