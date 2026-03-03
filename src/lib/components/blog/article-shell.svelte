<script lang="ts">
	import { ChevronDown } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import { slide } from 'svelte/transition';
	import { Badge } from '$lib/components/ui/badge';
	import InlineMathText from '$lib/components/math/inline-math-text.svelte';
	import MathExpression from '$lib/components/math/math-expression.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import type { PostHeading } from '$lib/content/post-headings';

	type TocPart = {
		kind: 'text' | 'math';
		value: string;
	};

	type TocItem = {
		id: string;
		level: number;
		parts: TocPart[];
	};

	type TocSection = {
		section: TocItem;
		subsections: TocItem[];
	};

	type Props = {
		title: string;
		subtitle: string;
		equation: string;
		publishedOn: string;
		readTime: string;
		author: string;
		tags: string[];
		tableOfContents: PostHeading[];
		children?: Snippet;
	};

	let { title, subtitle, equation, publishedOn, readTime, author, tags, tableOfContents, children }: Props = $props();
	let tocOpen = $state(false);

	const tocSections = $derived(buildTocSections(tableOfContents));

	function jumpToHeading(event: MouseEvent, id: string) {
		if (typeof window === 'undefined') return;
		if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

		const target = document.getElementById(id);
		if (!target) return;

		event.preventDefault();
		target.scrollIntoView({ behavior: 'smooth', block: 'start' });
		window.history.replaceState(window.history.state, '', `#${id}`);
	}

	function buildTocSections(headings: PostHeading[]): TocSection[] {
		const sections: TocSection[] = [];

		for (const heading of headings) {
			const item: TocItem = {
				id: heading.id,
				level: heading.level,
				parts: splitInlineMath(heading.text)
			};

			if (heading.level === 1) {
				sections.push({
					section: item,
					subsections: []
				});
				continue;
			}

			if (sections.length === 0) {
				sections.push({
					section: item,
					subsections: []
				});
				continue;
			}

			sections[sections.length - 1].subsections.push(item);
		}

		return sections;
	}

	function splitInlineMath(value: string): TocPart[] {
		const parts: TocPart[] = [];
		let buffer = '';
		let mathBuffer = '';
		let inMath = false;

		for (let index = 0; index < value.length; index += 1) {
			const char = value[index];
			const escaped = index > 0 && value[index - 1] === '\\';

			if (char === '$' && !escaped) {
				if (!inMath) {
					if (buffer.length > 0) {
						parts.push({
							kind: 'text',
							value: buffer.replace(/\\\$/g, '$')
						});
					}
					buffer = '';
					mathBuffer = '';
					inMath = true;
				} else {
					if (mathBuffer.trim().length > 0) {
						parts.push({
							kind: 'math',
							value: mathBuffer
						});
					} else {
						buffer += '$$';
					}
					mathBuffer = '';
					inMath = false;
				}
				continue;
			}

			if (inMath) {
				mathBuffer += char;
			} else {
				buffer += char;
			}
		}

		if (inMath) {
			buffer += `$${mathBuffer}`;
		}

		if (buffer.length > 0 || parts.length === 0) {
			parts.push({
				kind: 'text',
				value: buffer.replace(/\\\$/g, '$')
			});
		}

		return parts;
	}
</script>

<article class="mx-auto max-w-4xl space-y-6 sm:space-y-8">
	<header class="space-y-4 rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-sm sm:space-y-5 sm:p-8">
		<div class="flex flex-wrap items-center gap-2">
			{#each tags as tag (tag)}
				<Badge variant="secondary" class="border border-border/80 bg-background/70">
					{tag}
				</Badge>
			{/each}
		</div>

		<div class="space-y-2">
			<h1 class="text-3xl leading-tight tracking-tight sm:text-5xl">
				<InlineMathText text={title} />
			</h1>
			<p class="max-w-3xl text-sm text-muted-foreground sm:text-lg">{subtitle}</p>
		</div>

		<div class="flex flex-col items-start gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
			<span>By {author}</span>
			<span>{publishedOn}</span>
			<span>{readTime} read</span>
			<MathExpression
				math={equation}
				class="max-w-full overflow-x-auto text-foreground/85 [&_.katex]:text-[0.92em] sm:[&_.katex]:text-[1em]"
			/>
		</div>
	</header>

	{#if tocSections.length > 0}
		<aside
			class="rounded-2xl border border-border/70 bg-gradient-to-br from-sky-100/45 via-card/88 to-cyan-100/40 p-5 shadow-sm dark:from-sky-950/20 dark:via-card/80 dark:to-cyan-950/20 sm:p-6"
		>
			<button
				type="button"
				class="group flex w-full items-center justify-between gap-3 rounded-md px-1 py-0.5 text-left text-muted-foreground transition hover:text-foreground"
				aria-expanded={tocOpen}
				aria-controls="post-toc-panel"
				onclick={() => (tocOpen = !tocOpen)}
			>
				<span class="text-xs font-semibold uppercase tracking-[0.16em]">Table of contents</span>
				<span class="inline-flex items-center gap-2">
					<span class="text-[11px] text-muted-foreground/85">{tableOfContents.length} items</span>
					<ChevronDown
						class={`size-3.5 transition-transform duration-200 ${tocOpen ? 'rotate-180' : 'rotate-0'}`}
					/>
				</span>
			</button>
			{#if tocOpen}
				<div id="post-toc-panel" transition:slide={{ duration: 190 }}>
					<nav aria-label="Table of contents" class="mt-3">
						<ol class="space-y-3">
							{#each tocSections as group (group.section.id)}
								<li>
									<a
										href={`#${group.section.id}`}
										onclick={(event) => jumpToHeading(event, group.section.id)}
										class="group flex items-start gap-2 rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-sm font-semibold text-foreground transition hover:border-primary/35 hover:bg-background"
									>
										<span
											aria-hidden="true"
											class="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/75 transition group-hover:bg-primary"
										></span>
										<span class="flex flex-wrap items-baseline gap-x-0.5 gap-y-1">
											{#each group.section.parts as part, partIndex (`${group.section.id}-top-${partIndex}`)}
												{#if part.kind === 'math'}
													<MathExpression
														math={part.value}
														class="inline-flex [&_.katex]:text-[0.95em] [&_.katex]:text-foreground"
													/>
												{:else}
													<span>{part.value}</span>
												{/if}
											{/each}
										</span>
									</a>

									{#if group.subsections.length > 0}
										<ol class="mt-2 space-y-1 border-l border-border/70 pl-4">
											{#each group.subsections as subsection (subsection.id)}
												<li>
													<a
														href={`#${subsection.id}`}
														onclick={(event) => jumpToHeading(event, subsection.id)}
														class="group flex items-start gap-2 rounded-md px-2 py-1.5 text-sm text-foreground/88 transition hover:bg-background/70 hover:text-foreground"
													>
														<span
															aria-hidden="true"
															class="mt-1.5 h-1.5 w-1.5 rounded-full bg-border transition group-hover:bg-primary/80"
														></span>
														<span class="flex flex-wrap items-baseline gap-x-0.5 gap-y-1">
															{#each subsection.parts as part, partIndex (`${subsection.id}-sub-${partIndex}`)}
																{#if part.kind === 'math'}
																	<MathExpression
																		math={part.value}
																		class="inline-flex [&_.katex]:text-[0.92em] [&_.katex]:text-foreground"
																	/>
																{:else}
																	<span>{part.value}</span>
																{/if}
															{/each}
														</span>
													</a>
												</li>
											{/each}
										</ol>
									{/if}
								</li>
							{/each}
						</ol>
					</nav>
				</div>
			{/if}
		</aside>
	{/if}

	<Separator />

	<div
		class="prose prose-sm max-w-none prose-headings:scroll-mt-28 prose-headings:font-semibold prose-headings:text-foreground prose-p:text-foreground/90 prose-li:text-foreground/90 prose-strong:text-foreground prose-th:text-foreground prose-td:text-foreground/85 prose-blockquote:text-foreground/80 prose-a:text-primary prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-foreground prose-pre:border prose-pre:border-border/70 prose-pre:bg-background/80 sm:prose-base"
	>
		{@render children?.()}
	</div>
</article>
