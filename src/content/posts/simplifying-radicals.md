---
title: 'Simplifying Radicals Without Guessing'
subtitle: 'Use factor trees and pairing rules to simplify square roots cleanly'
excerpt: 'Learn a repeatable process for simplifying radicals by prime factorization, pairing, and pulling perfect squares outside the radical.'
publishedOn: 'March 4, 2026'
publishedAt: '2026-03-04'
readTime: '8 min'
author: 'Max'
tags:
  - algebra
  - radicals
  - prime factorization
  - simplification
equation: '\sqrt{72}=6\sqrt{2}'
featured: false
devOnly: true
---

<script>
	import LazyPostToolEmbed from '$lib/components/blog/lazy-post-tool-embed.svelte';
</script>

At Mathnasium Lakeland Highlands, students usually do best with radicals when they follow one process every time instead of guessing factors. The goal is to rewrite a square root as a simpler equivalent form.

## Table of Contents

- [Why This Process Works](#why-this-process-works)
- [Build the Factor Tree](#build-the-factor-tree)
- [Group Prime Pairs Under the Radical](#group-prime-pairs-under-the-radical)
- [Split, Simplify, and Multiply](#split-simplify-and-multiply)
- [Try It Interactively](#try-it-interactively)
- [Common Mistakes to Avoid](#common-mistakes-to-avoid)

## Why This Process Works

A radical can only simplify when part of the number under the root is a perfect square.

For example, if a radicand contains $2\cdot2$, then:

$$
\sqrt{2\cdot2}=\sqrt{4}=2
$$

So each matching prime pair inside the radical gives one factor outside the radical.

## Build the Factor Tree

Suppose we start with:

$$
\sqrt{72}
$$

Write the factor tree structure:

<figure style="margin:1.25rem 0;display:flex;justify-content:center">
<svg viewBox="0 0 420 280" width="420" height="280" style="max-width:100%;height:auto" role="img" aria-label="Factor tree for 72">
  <!-- edges -->
  <line x1="247" y1="48" x2="141" y2="86" stroke="#64748b" stroke-width="1.8"/>
  <line x1="247" y1="48" x2="353" y2="86" stroke="#64748b" stroke-width="1.8"/>
  <line x1="141" y1="122" x2="93" y2="160" stroke="#64748b" stroke-width="1.8"/>
  <line x1="141" y1="122" x2="190" y2="160" stroke="#64748b" stroke-width="1.8"/>
  <line x1="353" y1="122" x2="320" y2="160" stroke="#64748b" stroke-width="1.8"/>
  <line x1="353" y1="122" x2="385" y2="160" stroke="#64748b" stroke-width="1.8"/>
  <line x1="93" y1="196" x2="60" y2="234" stroke="#64748b" stroke-width="1.8"/>
  <line x1="93" y1="196" x2="125" y2="234" stroke="#64748b" stroke-width="1.8"/>
  <!-- internal nodes: 72, 8, 9, 4 -->
  <circle cx="247" cy="30" r="18" fill="rgba(45,212,191,0.22)" stroke="rgba(15,23,42,0.32)" stroke-width="1.5"/>
  <text x="247" y="35" text-anchor="middle" font-size="14" font-weight="600" fill="#0f172a">72</text>
  <circle cx="141" cy="104" r="18" fill="rgba(45,212,191,0.22)" stroke="rgba(15,23,42,0.32)" stroke-width="1.5"/>
  <text x="141" y="109" text-anchor="middle" font-size="14" font-weight="600" fill="#0f172a">8</text>
  <circle cx="353" cy="104" r="18" fill="rgba(45,212,191,0.22)" stroke="rgba(15,23,42,0.32)" stroke-width="1.5"/>
  <text x="353" y="109" text-anchor="middle" font-size="14" font-weight="600" fill="#0f172a">9</text>
  <circle cx="93" cy="178" r="18" fill="rgba(45,212,191,0.22)" stroke="rgba(15,23,42,0.32)" stroke-width="1.5"/>
  <text x="93" y="183" text-anchor="middle" font-size="14" font-weight="600" fill="#0f172a">4</text>
  <!-- leaf nodes (primes): three 2s, two 3s -->
  <circle cx="190" cy="178" r="18" fill="rgba(14,165,233,0.2)" stroke="rgba(15,23,42,0.32)" stroke-width="1.5"/>
  <text x="190" y="183" text-anchor="middle" font-size="14" font-weight="600" fill="#0f172a">2</text>
  <circle cx="320" cy="178" r="18" fill="rgba(14,165,233,0.2)" stroke="rgba(15,23,42,0.32)" stroke-width="1.5"/>
  <text x="320" y="183" text-anchor="middle" font-size="14" font-weight="600" fill="#0f172a">3</text>
  <circle cx="385" cy="178" r="18" fill="rgba(14,165,233,0.2)" stroke="rgba(15,23,42,0.32)" stroke-width="1.5"/>
  <text x="385" y="183" text-anchor="middle" font-size="14" font-weight="600" fill="#0f172a">3</text>
  <circle cx="60" cy="252" r="18" fill="rgba(14,165,233,0.2)" stroke="rgba(15,23,42,0.32)" stroke-width="1.5"/>
  <text x="60" y="257" text-anchor="middle" font-size="14" font-weight="600" fill="#0f172a">2</text>
  <circle cx="125" cy="252" r="18" fill="rgba(14,165,233,0.2)" stroke="rgba(15,23,42,0.32)" stroke-width="1.5"/>
  <text x="125" y="257" text-anchor="middle" font-size="14" font-weight="600" fill="#0f172a">2</text>
</svg>
</figure>

In this tree, <span style="color:#0f766e;font-weight:600">green nodes</span> are composite numbers and <span style="color:#0284c7;font-weight:600">blue nodes</span> are prime numbers.

Now read the prime leaves to factor $72$ completely:

$$
72=2\cdot2\cdot2\cdot3\cdot3
$$

Now place that full prime factorization under one radical:

$$
\sqrt{72}=\sqrt{2\cdot2\cdot2\cdot3\cdot3}
$$

The factor tree is just a visual way to make sure we reached only prime leaves.

## Group Prime Pairs Under the Radical

Find matching pairs of primes:

- one pair of $2$'s
- one leftover $2$
- one pair of $3$'s

Rewrite using grouped factors:

$$
\sqrt{72}=\sqrt{(2\cdot2)(3\cdot3)\cdot2}
$$

Multiply each pair:

$$
\sqrt{72}=\sqrt{4\cdot9\cdot2}
$$

## Split, Simplify, and Multiply

Split into separate radicals:

$$
\sqrt{4}\cdot\sqrt{9}\cdot\sqrt{2}
$$

Simplify each radical:

$$
2\cdot3\cdot\sqrt{2}
$$

Multiply the outside factors:

$$
\sqrt{72}=6\sqrt{2}
$$

That is the same six-step process we use for any square-root simplification.

## Try It Interactively

Use the tool below to enter any whole-number radicand and walk through the exact steps:

1. factor tree
2. prime factorization under one radical
3. pair grouping
4. multiplying pairs
5. splitting radicals
6. simplifying and multiplying outside factors

<div class="not-prose my-8 rounded-2xl border border-border/70 bg-card/70 p-4">
	<LazyPostToolEmbed
		toolId="simplifying-radicals-walkthrough"
		title="Simplifying Radicals Walkthrough"
	/>
</div>

## Common Mistakes to Avoid

1. Stopping before prime factorization is complete.
2. Pulling out a single prime instead of a matching pair.
3. Forgetting to multiply the outside factors together.
4. Leaving perfect-square factors under the radical.

When students keep this checklist in order, radical simplification becomes procedural and reliable.
