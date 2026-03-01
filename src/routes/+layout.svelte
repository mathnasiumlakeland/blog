<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import { resolve } from '$app/paths';
	import { BookOpenText, Calculator, ExternalLink, Moon, Sigma, Sun } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
	let isDark = $state(false);

	function applyTheme(nextIsDark: boolean) {
		document.documentElement.classList.toggle('dark', nextIsDark);
		isDark = nextIsDark;
	}

	function toggleTheme() {
		const nextIsDark = !isDark;
		applyTheme(nextIsDark);
		localStorage.setItem('theme', nextIsDark ? 'dark' : 'light');
	}

	onMount(() => {
		const savedTheme = localStorage.getItem('theme');
		if (savedTheme === 'dark' || savedTheme === 'light') {
			applyTheme(savedTheme === 'dark');
			return;
		}

		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		applyTheme(prefersDark);
	});
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
				class="group inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-2.5 py-1.5 text-sm font-semibold shadow-sm transition hover:bg-card/82 sm:gap-2.5 sm:px-3"
			>
				<Sigma class="size-4 text-primary" />
				<span class="sm:hidden">Mathnasium</span>
				<span class="hidden sm:inline">Mathnasium Journal</span>
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

				<Button href={resolve('/posts')} size="sm" class="gap-1.5 px-2.5 hover:shadow-none sm:px-3">
					<BookOpenText class="size-4" />
					<span class="hidden sm:inline">Explore</span>
				</Button>
				<Button
					href={resolve('/tools')}
					size="sm"
					variant="outline"
					class="gap-1.5 px-2.5 hover:!bg-card/82 hover:!text-foreground hover:!shadow-none sm:px-3"
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

	<main class="relative z-10 mx-auto w-full max-w-6xl px-3 pb-14 pt-6 sm:px-6 sm:pb-16 sm:pt-10 lg:px-8">
		{@render children()}
	</main>

	<footer class="border-t border-border/70 bg-background/75 py-7 backdrop-blur-sm">
		<div
			class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-center text-sm text-muted-foreground sm:flex-row sm:items-center sm:px-6 sm:text-left lg:px-8"
		>
			<p>
				Schedule a free assessment for your child today.
				<a
					href="https://www.mathnasium.com/math-centers/lakelandhighlands"
					target="_blank"
					rel="noopener noreferrer"
					class="ml-1 font-medium text-primary underline-offset-4 hover:underline"
				>
					Schedule now
				</a>
			</p>
			<p class="text-xs text-foreground/70">Made by Mathnasium Lakeland Highlands</p>
		</div>
	</footer>
</div>
