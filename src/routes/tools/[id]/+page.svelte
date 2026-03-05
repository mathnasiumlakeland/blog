<script lang="ts">
	import {
		ArrowLeft,
		BookOpenText,
		Calculator,
		GraduationCap,
		Home,
		ListChecks,
		RefreshCcw
	} from '@lucide/svelte';
	import { browser } from '$app/environment';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import InlineMathText from '$lib/components/math/inline-math-text.svelte';
	import { loadInteractiveToolComponentById } from '$lib/components/math/tool-component-map';
	import { getPracticePromptByToolId, type ToolPracticePrompt } from '$lib/components/math/tool-practice';
	import { getInteractiveToolById } from '$lib/components/math/tool-registry';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const tool = $derived(getInteractiveToolById(data.id));
	const routePracticeDisabledToolIds = new Set([
		'scientific-calculator',
		'prime-factorization-factor-tree-lab',
		'parent-function-identification',
		'function-tranformation-practice'
	]);
	const supportsPracticeMode = $derived(!routePracticeDisabledToolIds.has(data.id));
	const toolPath = $derived(resolve(`/tools/${data.id}`));
	const practicePath = $derived(`${toolPath}?practice=1`);
	const practiceMode = $derived(
		supportsPracticeMode && browser && page.url.searchParams.get('practice') === '1'
	);

	let ToolComponent = $state<any>(null);
	let toolState = $state<'loading' | 'ready' | 'failed'>('loading');
	let practicePrompt = $state<ToolPracticePrompt | null>(null);
	let practiceInput = $state('');
	let practiceFeedback = $state<{ correct: boolean; message: string } | null>(null);

	let activeLoadToken = 0;

	$effect(() => {
		const id = data.id;
		activeLoadToken += 1;
		const loadToken = activeLoadToken;

		toolState = 'loading';
		ToolComponent = null;

		void (async () => {
			try {
				const component = await loadInteractiveToolComponentById(id);
				if (loadToken !== activeLoadToken) {
					return;
				}
				if (!component) {
					toolState = 'failed';
					return;
				}
				ToolComponent = component as any;
				toolState = 'ready';
			} catch {
				if (loadToken !== activeLoadToken) {
					return;
				}
				toolState = 'failed';
			}
		})();
	});

	$effect(() => {
		const id = data.id;
		if (!supportsPracticeMode || !practiceMode) {
			practicePrompt = null;
			practiceInput = '';
			practiceFeedback = null;
			return;
		}

		practicePrompt = getPracticePromptByToolId(id);
		practiceInput = '';
		practiceFeedback = null;
	});

	function formatExpectedValue(answer: number, tolerance: number) {
		if (tolerance === 0 && Number.isInteger(answer)) {
			return answer.toString();
		}
		return answer.toFixed(3);
	}

	function nextPracticePrompt() {
		practicePrompt = getPracticePromptByToolId(data.id);
		practiceInput = '';
		practiceFeedback = null;
	}

	function submitPracticeAnswer(event: SubmitEvent) {
		event.preventDefault();
		if (!practicePrompt) {
			return;
		}

		const studentAnswer = Number.parseFloat(practiceInput);
		if (!Number.isFinite(studentAnswer)) {
			practiceFeedback = {
				correct: false,
				message: 'Enter a valid number first.'
			};
			return;
		}

		const difference = Math.abs(studentAnswer - practicePrompt.answer);
		const isCorrect = difference <= practicePrompt.tolerance;

		if (isCorrect) {
			practiceFeedback = {
				correct: true,
				message: 'Correct. Nice work!'
			};
			return;
		}

		practiceFeedback = {
			correct: false,
			message: `Not quite. Expected about ${formatExpectedValue(practicePrompt.answer, practicePrompt.tolerance)}.`
		};
	}
</script>

{#if tool}
	<div class="space-y-6 sm:space-y-8">
		<section class="soft-grid rounded-3xl border border-border/70 bg-card/78 p-5 shadow-sm backdrop-blur-sm sm:p-8">
			<div class="space-y-4">
				<Badge class="w-fit border border-primary/20 bg-primary/12 px-3 py-1 text-[11px] text-primary sm:text-sm">
					<Calculator class="size-3.5" />
					Tool
				</Badge>
				<div class="space-y-2">
					<h1 class="text-3xl leading-tight sm:text-4xl">
						<InlineMathText text={tool.meta.title} />
					</h1>
					<p class="max-w-3xl text-sm text-muted-foreground sm:text-base">
						<InlineMathText text={tool.meta.description} />
					</p>
				</div>
				<div class="flex flex-wrap gap-2">
					<Button href={resolve('/tools')} variant="outline" class="gap-1.5 hover:!bg-card/82 hover:!text-foreground hover:!shadow-none">
						<ArrowLeft class="size-4" />
						Back to tools
					</Button>
					{#if supportsPracticeMode}
						{#if practiceMode}
							<Button href={toolPath} variant="outline" class="gap-1.5 hover:!bg-card/82 hover:!text-foreground hover:!shadow-none">
								<GraduationCap class="size-4" />
								Exit practice mode
							</Button>
						{:else}
							<Button href={practicePath} variant="secondary" class="gap-1.5">
								<GraduationCap class="size-4" />
								Practice mode
							</Button>
						{/if}
					{/if}
					<Button href={resolve('/')} variant="secondary" class="gap-1.5">
						<Home class="size-4" />
						Home
					</Button>
				</div>
			</div>
		</section>

		<Card class="border-border/70 bg-card/82 backdrop-blur-sm">
			<CardContent class="space-y-5 p-4 sm:p-6">
				{#if practiceMode && practicePrompt}
					<div class="rounded-xl border border-primary/35 bg-primary/7 p-3 sm:p-4">
						<div class="flex flex-wrap items-center justify-between gap-2">
							<p class="text-sm font-semibold text-foreground">Practice Mode</p>
							<Button size="sm" variant="outline" class="gap-1.5" onclick={nextPracticePrompt}>
								<RefreshCcw class="size-4" />
								New problem
							</Button>
						</div>
						<p class="mt-2 text-sm text-foreground">
							<InlineMathText text={practicePrompt.prompt} />
						</p>
						{#if practicePrompt.hint}
							<p class="mt-1 text-xs text-muted-foreground">
								<InlineMathText text={practicePrompt.hint} />
							</p>
						{/if}

						<form class="mt-3 flex flex-col gap-2 sm:flex-row" onsubmit={submitPracticeAnswer}>
							<Input
								type="number"
								step="any"
								class="sm:max-w-xs"
								placeholder="Enter your number"
								bind:value={practiceInput}
							/>
							<Button type="submit" size="sm" class="sm:w-auto">Check answer</Button>
						</form>

						{#if practiceFeedback}
							<p
								class={`mt-3 rounded-lg border px-3 py-2 text-sm ${
									practiceFeedback.correct
										? 'border-emerald-500/35 bg-emerald-100/65 text-emerald-900'
										: 'border-rose-500/35 bg-rose-100/70 text-rose-900'
								}`}
							>
								{practiceFeedback.message}
							</p>
						{/if}
					</div>
				{/if}
				{#if toolState === 'ready' && ToolComponent}
					<div class="rounded-xl border border-border/70 bg-background/75 p-2 sm:p-3">
						<ToolComponent />
					</div>
				{:else if toolState === 'failed'}
					<div
						class="soft-grid rounded-xl border border-border/70 bg-background/75 px-4 py-10 text-center text-sm text-muted-foreground"
					>
						This tool could not be loaded right now.
					</div>
				{:else}
					<div
						class="soft-grid rounded-xl border border-border/70 bg-background/75 px-4 py-10 text-center text-sm text-muted-foreground"
					>
						Loading interactive tool...
					</div>
				{/if}
				{#if data.relatedPosts.length > 0}
					<details class="rounded-xl border border-border/70 bg-background/70 p-3 sm:p-4">
						<summary
							class="cursor-pointer list-none text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden [&::marker]:hidden"
						>
							<span class="inline-flex items-center gap-2">
								<BookOpenText class="size-4 text-primary" />
								Read more
							</span>
						</summary>
						<p class="mt-3 text-xs text-muted-foreground">
							This resource appears in the following posts:
						</p>
						<ul class="mt-3 space-y-2">
							{#each data.relatedPosts as relatedPost (relatedPost.slug)}
								<li class="rounded-lg border border-border/70 bg-card/75 px-3 py-2">
									<a
										href={resolve(`/posts/${relatedPost.slug}`)}
										class="text-sm font-medium text-foreground underline-offset-2 hover:underline"
									>
										<InlineMathText text={relatedPost.title} />
									</a>
									<p class="mt-0.5 text-xs text-muted-foreground">
										{relatedPost.publishedOn}
									</p>
								</li>
							{/each}
						</ul>
					</details>
				{/if}
				<details class="rounded-xl border border-border/70 bg-background/70 p-3 sm:p-4">
					<summary
						class="cursor-pointer list-none text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden [&::marker]:hidden"
					>
						<span class="inline-flex items-center gap-2">
							<ListChecks class="size-4 text-primary" />
							Show tool details
						</span>
					</summary>
					<div class="mt-3 space-y-4">
						<div class="space-y-1 text-sm text-muted-foreground">
							<p>
								<span class="font-semibold text-foreground">Inputs:</span>
								<InlineMathText text={tool.meta.inputs} class="ml-1" />
							</p>
							<p>
								<span class="font-semibold text-foreground">Outputs:</span>
								<InlineMathText text={tool.meta.outputs} class="ml-1" />
							</p>
							<p>
								<span class="font-semibold text-foreground">Used for:</span>
								<InlineMathText text={tool.meta.useCase} class="ml-1" />
							</p>
						</div>
						<div class="flex flex-wrap gap-1.5">
							{#each tool.meta.tags as tag (tag)}
								<Badge variant="outline">{tag}</Badge>
							{/each}
						</div>
					</div>
				</details>
			</CardContent>
		</Card>
	</div>
{/if}
