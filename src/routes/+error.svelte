<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { AlertTriangle, Home } from '@lucide/svelte';
	import NotFoundPanel from '$lib/components/blog/not-found-panel.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';

	const status = $derived(page.status);
	const message = $derived(page.error?.message ?? 'Something went wrong.');
</script>

<svelte:head>
	<title>{status === 404 ? 'Page Not Found' : 'Unexpected Error'} | Mathnasium Pro</title>
	<meta name="robots" content="noindex" />
</svelte:head>

{#if status === 404}
	<NotFoundPanel />
{:else}
	<section class="mx-auto flex w-full max-w-3xl flex-1 items-center">
		<Card class="w-full border-border/70 bg-card/82 shadow-sm backdrop-blur-sm">
			<CardHeader class="space-y-3">
				<div class="flex items-center gap-3 text-primary">
					<div class="rounded-xl bg-primary/12 p-2">
						<AlertTriangle class="size-5" />
					</div>
					<p class="text-sm font-medium">Something interrupted this page.</p>
				</div>
				<CardTitle class="text-3xl tracking-tight">Unexpected error</CardTitle>
			</CardHeader>
			<CardContent class="space-y-5">
				<p class="text-sm text-muted-foreground sm:text-base">
					{message}
				</p>
				<div class="flex flex-col gap-2 sm:flex-row">
					<Button href={resolve('/')} class="w-full justify-center gap-1.5 sm:w-auto">
						<Home class="size-4" />
						Return home
					</Button>
				</div>
			</CardContent>
		</Card>
	</section>
{/if}
