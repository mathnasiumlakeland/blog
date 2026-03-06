---
title: 'What I Wish I Knew About Combinatorics'
subtitle: 'Where permutation and combination formulas actually come from'
excerpt: 'Build permutation and combination formulas from slot logic, overcounting, and divide-out corrections.'
publishedOn: 'March 5, 2026'
publishedAt: '2026-03-05'
readTime: '11 min'
author: 'Max'
difficulty: 'intermediate'
tags:
  - combinatorics
  - counting
  - permutations
  - combinations
equation: '\\binom{n}{r}=\\frac{n!}{r!(n-r)!}'
featured: false
devOnly: true
---

<script>
	import LazyPostToolEmbed from '$lib/components/blog/lazy-post-tool-embed.svelte';
</script>

Combinatorics used to feel like a list of formulas to memorize. The turning point is realizing each formula comes from one simple question: how many choices do we have at each step, and are we overcounting equivalent outcomes?

## Table of Contents

- [Start With Vocabulary](#start-with-vocabulary)
- [Permutations (Order Matters)](#permutations-order-matters)
- [Combinations (Order Does Not Matter)](#combinations-order-does-not-matter)
- [Quick Reference](#quick-reference)

## Start With Vocabulary

- **Permutations** are ordered lists.
- **Combinations** are unordered lists.

That one distinction drives almost every formula below.

<div class="not-prose my-8 rounded-2xl border border-border/70 bg-card/70 p-4">
	<LazyPostToolEmbed toolId="combinatorics-formula-lab" title="Combinatorics Formula Lab" />
</div>

## Permutations (Order Matters)

### Permutations with replacement

Suppose we have $r$ slots to fill from $n$ possible values, and values can repeat.

- First slot: $n$ choices.
- Second slot: still $n$ choices.
- Continue for $r$ slots.

So the count is:

$$
n \cdot n \cdot \dots \cdot n = n^r
$$

### Permutations without replacement (all $n$ slots)

Now assume we arrange all $n$ distinct items once each.

- First slot: $n$ choices.
- Second slot: $n-1$ choices.
- Third slot: $n-2$ choices.
- Continue down to $1$.

So the count is:

$$
n(n-1)(n-2)\dots 2\cdot 1 = n!
$$

### Permutations with duplicate values

If one value appears $m$ times, then plain $n!$ overcounts because swapping those identical copies does not create a new arrangement.

Correct by dividing by $m!$:

$$
\frac{n!}{m!}
$$

Example: the letters in "ODD" give $n=3$ with two identical D's ($m=2$):

$$
\frac{3!}{2!} = 3
$$

General duplicate-count form:

$$
\frac{n!}{n_1!n_2!\cdots n_k!}
$$

### Permutations in $r$ slots (no replacement)

This is the standard $nPr$ case.

Direct product form:

$$
n(n-1)(n-2)\dots(n-r+1)
$$

Factorial form:

$$
{}_nP_r = \frac{n!}{(n-r)!}
$$

Special case check when $r=n$:

$$
{}_nP_n = \frac{n!}{0!} = n!
$$

## Combinations (Order Does Not Matter)

### Combinations with no duplicates

Start from permutations in $r$ slots:

$$
{}_nP_r = \frac{n!}{(n-r)!}
$$

But each selected group has $r!$ internal orderings that all represent the same combination, so divide by $r!$:

$$
{}_nC_r = \frac{n!}{r!(n-r)!} = \binom{n}{r}
$$

Example: choose $2$ letters from HAND ($n=4$, $r=2$):

$$
\binom{4}{2} = \frac{4!}{2!2!} = 6
$$

You can also see this as:

$$
\frac{{}_4P_2}{2!} = \frac{12}{2} = 6
$$

### Why this divide-by-$r!$ idea keeps showing up

Whenever order is irrelevant, a whole family of orderings collapses to one outcome. Dividing by a factorial removes that overcount.

A classic lattice-path version of the same logic:

<div class="not-prose my-8 rounded-2xl border border-border/70 bg-card/70 p-4">
	<LazyPostToolEmbed toolId="lattice-paths-explorer" title="Lattice Paths Explorer" />
</div>

From $(0,0)$ to $(m,n)$ using only right/up moves, every shortest path has $m+n$ steps with $m$ of one type and $n$ of the other. Counting those path-strings gives:

$$
\binom{m+n}{m} = \binom{m+n}{n}
$$

Same structure, different context.

## Quick Reference

- Permutations with replacement: $n^r$
- Permutations in $r$ slots (no replacement): $\frac{n!}{(n-r)!}$
- Permutations with duplicates: $\frac{n!}{n_1!n_2!\cdots n_k!}$
- Combinations: $\frac{n!}{r!(n-r)!}$

Also useful edge case:

$$
\binom{n}{n} = 1
$$

Combinatorics gets much easier once you read formulas as stories about choices and overcounting, not symbols to memorize.
