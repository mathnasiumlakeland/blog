---
title: 'Counting Up-Right Paths on a Grid'
subtitle: 'From (n,n) symmetry to the general (m,n) counting rule'
excerpt: 'Use Manhattan distance, binomial coefficients, and an interactive path builder to count right-up lattice paths.'
publishedOn: 'March 1, 2026'
publishedAt: '2026-03-01'
readTime: '7 min'
tags:
  - combinatorics
  - counting
  - lattice paths
equation: '\binom{m+n}{m}'
featured: false
---

<script>
	import LatticePathsVisual from '$lib/components/math/lattice-paths-visual.svelte';
</script>

We start with the symmetric version first: from $(0,0)$ to $(n,n)$, moving only right or up.

Each valid path uses exactly $n$ right moves and $n$ up moves, so every route has Manhattan (taxi-cab) length:

$$
d_M = n+n = 2n
$$

For comparison, the straight-line Euclidean distance to $(n,n)$ is:

$$
d_E = \sqrt{n^2+n^2}=n\sqrt{2}
$$

That is the key taxi-cab idea: on city blocks, you count grid steps, not diagonal shortcuts.

The number of distinct paths in the $(n,n)$ case is:

$$
\binom{2n}{n}=\frac{(2n)!}{n!\,n!}
$$

<div class="not-prose my-8 rounded-2xl border border-border/70 bg-card/70 p-4">
	<LatticePathsVisual />
</div>

## Why the binomial coefficient appears

Think of a path as a string of length $2n$ made of letters $R$ and $U$.

- You must place exactly $n$ copies of $R$.
- The remaining slots are automatically $U$.

So the count is "choose which $n$ of the $2n$ slots are $R$", which is $\binom{2n}{n}$.

In the interactive $(9,9)$ builder, that means you can place only 9 right steps and 9 up steps total.
As each move is placed, the ledger tracks how many of each move type are still available.

## General version at the bottom: from $(0,0)$ to $(m,n)$

Now the move totals are not equal:

- right moves: $m$
- up moves: $n$
- total steps: $m+n$

So the number of valid up-right routes is:

$$
\binom{m+n}{m}=\binom{m+n}{n}=\frac{(m+n)!}{m!\,n!}
$$

Use the sliders in the final panel of the interactive to change $m$ and $n$ and see the count update live.
