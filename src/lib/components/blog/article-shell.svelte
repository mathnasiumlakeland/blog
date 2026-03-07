<script lang="ts">
	import { ChevronDown } from '@lucide/svelte';
	import { onMount, type Snippet } from 'svelte';
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
		depth: 1 | 2;
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
	let articleContent: HTMLElement | null = $state(null);
	let tocOpen = $state(false);
	let activeHeadingId = $state('');
	let desktopTocExpansionLocked = $state(false);
	let desktopTocLockedSectionId = $state('');
	let tocUnlockTimer: number | undefined = $state();

	const tocSections = $derived(buildTocSections(tableOfContents));
	const hasToc = $derived(tocSections.length > 0);
	const activeSectionId = $derived(resolveActiveSectionId(tocSections, activeHeadingId));

	function resolveTocSectionId(id: string) {
		return resolveActiveSectionId(tocSections, id);
	}

	function scheduleTocUnlock() {
		if (typeof window === 'undefined') return;
		if (tocUnlockTimer !== undefined) {
			window.clearTimeout(tocUnlockTimer);
		}

		tocUnlockTimer = window.setTimeout(() => {
			desktopTocExpansionLocked = false;
			desktopTocLockedSectionId = '';
			tocUnlockTimer = undefined;
		}, 140);
	}

	function smoothScrollToHeading(id: string) {
		if (typeof window === 'undefined') return;

		const target = document.getElementById(id);
		if (!target) return;
		const behavior: ScrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
			? 'auto'
			: 'smooth';

		window.dispatchEvent(new CustomEvent('post-anchor-scroll'));
		desktopTocExpansionLocked = true;
		desktopTocLockedSectionId = resolveTocSectionId(id);
		scheduleTocUnlock();
		activeHeadingId = id;
		target.scrollIntoView({ behavior, block: 'start' });

		const nextUrl = new URL(window.location.href);
		nextUrl.hash = id;
		window.history.replaceState(window.history.state, '', nextUrl);
	}

	function jumpToHeading(event: MouseEvent, id: string) {
		if (typeof window === 'undefined') return;
		if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

		event.preventDefault();
		smoothScrollToHeading(id);
	}

	function smoothScrollBodyHashLinksAction(node: HTMLElement) {
		const handleClick = (event: MouseEvent) => {
			if (typeof window === 'undefined') return;
			if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
			if (!(event.target instanceof Element)) return;

			const anchor = event.target.closest('a');
			if (!(anchor instanceof HTMLAnchorElement)) return;
			if (anchor.target && anchor.target !== '_self') return;
			if (anchor.hasAttribute('download')) return;

			const href = anchor.getAttribute('href') ?? '';
			if (!href.includes('#')) return;

			const resolvedUrl = new URL(anchor.href, window.location.href);
			if (resolvedUrl.origin !== window.location.origin) return;
			if (resolvedUrl.pathname !== window.location.pathname) return;
			if (!resolvedUrl.hash || resolvedUrl.hash.length <= 1) return;

			const id = decodeURIComponent(resolvedUrl.hash.slice(1));
			const target = document.getElementById(id);
			if (!target) return;

			event.preventDefault();
			smoothScrollToHeading(id);
		};

		node.addEventListener('click', handleClick);

		return {
			destroy() {
				node.removeEventListener('click', handleClick);
			}
		};
	}

	function buildTocSections(headings: PostHeading[]): TocSection[] {
		const sections: TocSection[] = [];

		for (const heading of headings) {
			const item: TocItem = {
				id: heading.id,
				depth: heading.depth,
				parts: splitInlineMath(heading.text)
			};

			if (heading.depth === 1) {
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

	function resolveActiveSectionId(sections: TocSection[], activeId: string) {
		for (const group of sections) {
			if (group.section.id === activeId || group.subsections.some((item) => item.id === activeId)) {
				return group.section.id;
			}
		}

		return sections[0]?.section.id ?? '';
	}

	function isSectionCurrent(group: TocSection) {
		if (desktopTocExpansionLocked) {
			return desktopTocLockedSectionId === group.section.id;
		}

		return activeSectionId === group.section.id;
	}

	function isSectionExpanded(group: TocSection) {
		if (desktopTocExpansionLocked) {
			return group.subsections.length > 0 && desktopTocLockedSectionId === group.section.id;
		}

		return group.subsections.length > 0 && activeSectionId === group.section.id;
	}

	function isSubsectionCurrent(id: string) {
		return activeHeadingId === id;
	}

	function collectTrackedHeadings() {
		return tableOfContents
			.map(({ id }) => document.getElementById(id))
			.filter((heading): heading is HTMLElement => heading instanceof HTMLElement);
	}

	function syncActiveHeading(trackedHeadings: HTMLElement[]) {
		if (trackedHeadings.length === 0 || typeof window === 'undefined') {
			return;
		}

		const epsilon = 2;
		const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
		if (window.scrollY >= maxScroll - epsilon) {
			activeHeadingId = trackedHeadings.at(-1)?.id ?? trackedHeadings[0].id;
			return;
		}

		const offset = window.innerWidth >= 1280 ? 168 : 132;
		let nextActiveId = trackedHeadings[0].id;

		for (const heading of trackedHeadings) {
			if (heading.getBoundingClientRect().top <= offset) {
				nextActiveId = heading.id;
			} else {
				break;
			}
		}

		activeHeadingId = nextActiveId;
	}

	onMount(() => {
		if (tableOfContents.length === 0 || typeof window === 'undefined') {
			return;
		}

		const trackedHeadings = collectTrackedHeadings();
		if (trackedHeadings.length === 0) {
			return;
		}

		const hashId = decodeURIComponent(window.location.hash.slice(1));
		if (hashId && trackedHeadings.some((heading) => heading.id === hashId)) {
			activeHeadingId = hashId;
		}

		let frame = 0;
		let resizeObserver: ResizeObserver | undefined;

		const queueSync = () => {
			cancelAnimationFrame(frame);
			if (desktopTocExpansionLocked) {
				scheduleTocUnlock();
			}
			frame = window.requestAnimationFrame(() => syncActiveHeading(trackedHeadings));
		};

		const handleHashChange = () => {
			const nextHashId = decodeURIComponent(window.location.hash.slice(1));
			if (nextHashId && trackedHeadings.some((heading) => heading.id === nextHashId)) {
				activeHeadingId = nextHashId;
			}
			queueSync();
		};

		queueSync();
		window.addEventListener('scroll', queueSync, { passive: true });
		window.addEventListener('resize', queueSync);
		window.addEventListener('hashchange', handleHashChange);

		if (articleContent && typeof ResizeObserver !== 'undefined') {
			resizeObserver = new ResizeObserver(queueSync);
			resizeObserver.observe(articleContent);
		}

		return () => {
			cancelAnimationFrame(frame);
			if (tocUnlockTimer !== undefined) {
				window.clearTimeout(tocUnlockTimer);
			}
			window.removeEventListener('scroll', queueSync);
			window.removeEventListener('resize', queueSync);
			window.removeEventListener('hashchange', handleHashChange);
			resizeObserver?.disconnect();
		};
	});

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

<article class="mx-auto w-full max-w-7xl space-y-5 sm:space-y-8">
	<header
		class={`soft-grid relative mx-auto max-w-4xl space-y-4 overflow-hidden rounded-2xl border border-border/70 bg-card/78 p-4 shadow-sm backdrop-blur-sm sm:space-y-5 sm:p-8 ${hasToc ? 'xl:mx-0' : ''}`}
	>
		<div class="flex flex-wrap items-center gap-2">
			{#each tags as tag (tag)}
				<Badge variant="secondary" class="border border-border/80 bg-background/70">
					{tag}
				</Badge>
			{/each}
		</div>

		<div class="space-y-2">
			<h1 class="text-[clamp(1.85rem,8vw,3rem)] leading-[1.12] tracking-tight sm:text-5xl">
				<InlineMathText text={title} />
			</h1>
			<p class="max-w-3xl text-[0.97rem] leading-relaxed text-muted-foreground sm:text-lg">{subtitle}</p>
		</div>

		<div
			class="flex flex-col items-start gap-1.5 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-4"
		>
			<span>By {author}</span>
			<span>{publishedOn}</span>
			<span>{readTime} read</span>
			<MathExpression
				math={equation}
				class="max-w-full overflow-x-auto text-foreground/85 [&_.katex]:text-[0.92em] sm:[&_.katex]:text-[1em]"
			/>
		</div>
	</header>

	<div class={hasToc ? 'xl:grid xl:grid-cols-[minmax(0,1fr)_18rem] xl:gap-10' : ''}>
		<div class="min-w-0">
			<div class={`mx-auto w-full max-w-4xl space-y-5 sm:space-y-8 ${hasToc ? 'xl:mx-0' : ''}`}>
				{#if hasToc}
					<aside
						class="rounded-2xl border border-border/70 bg-gradient-to-br from-sky-100/45 via-card/88 to-cyan-100/40 shadow-sm xl:hidden dark:from-sky-950/20 dark:via-card/80 dark:to-cyan-950/20"
					>
						<button
							type="button"
							class="group flex w-full items-center justify-between gap-3 rounded-2xl px-5 py-4 text-left text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-6"
							aria-expanded={tocOpen}
							aria-controls="post-toc-panel"
							onclick={() => (tocOpen = !tocOpen)}
						>
							<span class="text-xs font-semibold uppercase tracking-[0.16em]">On this page</span>
							<span class="inline-flex items-center gap-2">
								<span class="text-[11px] text-muted-foreground/85">{tableOfContents.length} sections</span>
								<ChevronDown
									class={`size-3.5 transition-transform duration-200 ${tocOpen ? 'rotate-180' : 'rotate-0'}`}
								/>
							</span>
						</button>
						{#if tocOpen}
							<div id="post-toc-panel" class="px-5 pb-5 sm:px-6 sm:pb-6" transition:slide={{ duration: 190 }}>
								<nav aria-label="Table of contents" class="mt-1">
									<ol class="space-y-3">
										{#each tocSections as group (group.section.id)}
											<li class="space-y-1.5">
												<a
													href={`#${group.section.id}`}
													aria-current={isSectionCurrent(group) ? 'location' : undefined}
													onclick={(event) => jumpToHeading(event, group.section.id)}
													class={[
														'block rounded-lg border px-3 py-2 text-[0.95rem] leading-6 transition-colors',
														isSectionCurrent(group)
															? 'border-primary/30 bg-background/90 font-semibold text-foreground'
															: 'border-border/70 bg-background/65 text-muted-foreground hover:text-foreground'
													]}
												>
													<span class="flex flex-wrap items-baseline gap-x-0.5 gap-y-1">
														{#each group.section.parts as part, partIndex (`${group.section.id}-mobile-section-${partIndex}`)}
															{#if part.kind === 'math'}
																<MathExpression
																	math={part.value}
																	class="inline-flex [&_.katex]:text-[0.95em] [&_.katex]:text-current"
																/>
															{:else}
																<span>{part.value}</span>
															{/if}
														{/each}
													</span>
												</a>

												{#if group.subsections.length > 0}
													<ol class="space-y-1.5 border-l border-border/70 pl-4">
														{#each group.subsections as subsection (subsection.id)}
															<li>
																<a
																	href={`#${subsection.id}`}
																	aria-current={isSubsectionCurrent(subsection.id) ? 'location' : undefined}
																	onclick={(event) => jumpToHeading(event, subsection.id)}
																	class={[
																		'block rounded-md px-2 py-1.5 text-[0.93rem] leading-6 transition-colors',
																		isSubsectionCurrent(subsection.id)
																			? 'bg-background/90 font-medium text-foreground'
																			: 'text-muted-foreground hover:bg-background/60 hover:text-foreground'
																	]}
																>
																	<span class="flex flex-wrap items-baseline gap-x-0.5 gap-y-1">
																		{#each subsection.parts as part, partIndex (`${subsection.id}-mobile-subsection-${partIndex}`)}
																			{#if part.kind === 'math'}
																				<MathExpression
																					math={part.value}
																					class="inline-flex [&_.katex]:text-[0.92em] [&_.katex]:text-current"
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
					bind:this={articleContent}
					class="post-reading-body prose prose-sm max-w-none prose-headings:scroll-mt-28 prose-headings:font-semibold prose-headings:text-foreground prose-h2:mt-10 prose-h2:mb-4 prose-h3:mt-8 prose-h3:mb-3 prose-p:text-foreground/90 prose-p:leading-7 prose-p:tracking-[0.002em] prose-li:my-1.5 prose-li:text-foreground/90 prose-li:leading-7 prose-ul:pl-5 prose-ol:pl-5 prose-strong:text-foreground prose-th:text-foreground prose-td:text-foreground/85 prose-blockquote:text-foreground/80 prose-a:text-primary prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-foreground prose-pre:rounded-xl prose-pre:border prose-pre:border-border/70 prose-pre:bg-background/80 prose-img:rounded-xl prose-img:border prose-img:border-border/60 sm:prose-base"
					use:smoothScrollBodyHashLinksAction
				>
					{@render children?.()}
				</div>
			</div>
		</div>

		{#if hasToc}
			<aside class="hidden xl:block">
				<div class="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto border-l border-border/70 pl-6">
					<p class="text-sm font-medium tracking-[0.01em] text-muted-foreground">On this page</p>
					<nav aria-label="Table of contents" class="mt-5 pr-3">
						<ol class="space-y-4">
							{#each tocSections as group (group.section.id)}
								<li class="space-y-2">
									<div>
										<a
											href={`#${group.section.id}`}
											aria-current={isSectionCurrent(group) ? 'location' : undefined}
											onclick={(event) => jumpToHeading(event, group.section.id)}
											class={[
												'block text-[0.98rem] leading-7 transition-colors',
												isSectionCurrent(group)
													? 'font-semibold text-foreground'
													: 'text-muted-foreground hover:text-foreground'
											]}
										>
											<span class="flex flex-wrap items-baseline gap-x-0.5 gap-y-1">
												{#each group.section.parts as part, partIndex (`${group.section.id}-desktop-section-${partIndex}`)}
													{#if part.kind === 'math'}
														<MathExpression
															math={part.value}
															class="inline-flex [&_.katex]:text-[0.95em] [&_.katex]:text-current"
														/>
													{:else}
														<span>{part.value}</span>
													{/if}
												{/each}
											</span>
										</a>
									</div>

									{#if isSectionExpanded(group)}
										<ol class="space-y-2 pl-4" transition:slide={{ duration: 180 }}>
											{#each group.subsections as subsection (subsection.id)}
												<li>
													<a
														href={`#${subsection.id}`}
														aria-current={isSubsectionCurrent(subsection.id) ? 'location' : undefined}
														onclick={(event) => jumpToHeading(event, subsection.id)}
														class={[
															'block text-[0.95rem] leading-7 transition-colors',
															isSubsectionCurrent(subsection.id)
																? 'font-medium text-foreground'
																: 'text-muted-foreground hover:text-foreground'
														]}
													>
														<span class="flex flex-wrap items-baseline gap-x-0.5 gap-y-1">
															{#each subsection.parts as part, partIndex (`${subsection.id}-desktop-subsection-${partIndex}`)}
																{#if part.kind === 'math'}
																	<MathExpression
																		math={part.value}
																		class="inline-flex [&_.katex]:text-[0.92em] [&_.katex]:text-current"
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
			</aside>
		{/if}
	</div>
</article>
