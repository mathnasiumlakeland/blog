---
title: "Pascal Triangle Patterns Mod n"
subtitle: "Combinatorics turns into geometry"
excerpt: "A visual study of binomial coefficients modulo small integers, revealing symmetry and fractal-like motifs."
publishedOn: "February 21, 2026"
publishedAt: "2026-02-21"
readTime: "6 min"
tags:
  - combinatorics
  - fractals
  - number theory
equation: '(a+b)^n = \sum_{k=0}^{n} \binom{n}{k} a^{n-k} b^k'
---

<script>
	import PascalModuloCanvas from '$lib/components/math/pascal-modulo-canvas.svelte';
</script>

Pascal's triangle starts as arithmetic, but modulo arithmetic turns it into visual texture.

The core identity is inline-friendly as $\binom{n}{k}=\binom{n-1}{k-1}+\binom{n-1}{k}$ and expands to:

$$
(a+b)^n = \sum_{k=0}^{n}\binom{n}{k}a^{n-k}b^k
$$

<div class="not-prose my-8 rounded-2xl border border-border/70 bg-card/70 p-4">
	<PascalModuloCanvas />
</div>

## Why patterns emerge

The recurrence propagates local structure down the triangle. Modulo constraints create repeating finite states, so motifs reappear at larger scales.

For modulo 2, the familiar Sierpinski-like voids show up. Other mod values build different geometries with alternating bands, triangular islands, and near-periodic diagonals.
