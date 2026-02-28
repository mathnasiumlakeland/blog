<script lang="ts">
	import '../app.css';
	import { resolve } from '$app/paths';
	import { Calculator, Sigma } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<title>Mathnasium Journal</title>
	<link rel="icon" href={favicon} />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta
		name="description"
		content="A clean, visual math blog built with Svelte 5, Tailwind, and shadcn-svelte."
	/>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Manrope:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="relative min-h-screen">
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div class="math-orb -left-20 top-24 size-80 bg-gradient-to-br from-cyan-300/60 to-teal-300/30"></div>
		<div
			class="math-orb -right-24 top-96 size-96 bg-gradient-to-br from-sky-300/45 to-blue-300/30 [animation-delay:1.8s]"
		></div>
	</div>

	<header class="sticky top-0 z-40 border-b border-border/70 bg-background/82 backdrop-blur-md">
		<div class="mx-auto flex max-w-6xl items-center justify-between px-3 py-3 sm:px-6 sm:py-4 lg:px-8">
			<a
				href={resolve('/')}
				class="group inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-2.5 py-1.5 text-sm font-semibold shadow-sm transition hover:bg-card sm:gap-2.5 sm:px-3"
			>
				<Sigma class="size-4 text-primary" />
				<span class="sm:hidden">Mathnasium</span>
				<span class="hidden sm:inline">Mathnasium Journal</span>
			</a>

			<nav class="hidden items-center gap-5 text-sm font-medium text-muted-foreground md:flex">
				<a class="transition hover:text-foreground" href={resolve('/')}>Home</a>
				<a class="transition hover:text-foreground" href={resolve('/posts')}>Posts</a>
				<a class="transition hover:text-foreground" href={resolve('/posts/wasm-newton-lab')}
					>WASM Lab</a
				>
			</nav>

			<Button href={resolve('/posts')} size="sm" class="gap-1.5 px-2.5 sm:px-3">
				<Calculator class="size-4" />
				<span class="hidden sm:inline">Explore</span>
			</Button>
		</div>
	</header>

	<main class="relative z-10 mx-auto w-full max-w-6xl px-3 pb-14 pt-6 sm:px-6 sm:pb-16 sm:pt-10 lg:px-8">
		{@render children()}
	</main>

	<footer class="border-t border-border/70 bg-background/75 py-7 backdrop-blur-sm">
		<div
			class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-center text-sm text-muted-foreground sm:flex-row sm:items-center sm:px-6 sm:text-left lg:px-8"
		>
			<p>Mathnasium Journal - Visual notes on patterns, proofs, and playful computation.</p>
			<p class="font-mono text-xs text-foreground/70">Built with Svelte 5 + Tailwind + shadcn-svelte</p>
		</div>
	</footer>
</div>
