---
title: 'Prime Factorization'
subtitle: 'Build number sense with factor trees and complete prime decomposition'
excerpt: 'Learn how to classify numbers as prime or composite, then use factor trees to write complete prime factorizations every time.'
publishedOn: 'March 4, 2026'
publishedAt: '2026-03-04'
readTime: '8 min'
author: 'Max'
difficulty: 'beginner'
tags:
  - number theory
  - prime numbers
  - composite numbers
  - factor trees
  - prime factorization
equation: '84=2\cdot2\cdot3\cdot7'
featured: false
devOnly: true
---

<script>
	import LazyPostToolEmbed from '$lib/components/blog/lazy-post-tool-embed.svelte';
</script>

At Mathnasium Lakeland Highlands, students usually improve fastest when they treat prime/composite classification and prime factorization as one connected process. Factor trees make both ideas visible in one place.

## Table of Contents

- [Prime and Composite at a Glance](#prime-and-composite-at-a-glance)
- [Build a Factor Tree](#build-a-factor-tree)
- [Read the Prime Factorization](#read-the-prime-factorization)
- [Why This Process Always Works](#why-this-process-always-works)
- [Try the Integrated Factor Tree Practice](#try-the-integrated-factor-tree-practice)
- [Common Mistakes to Avoid](#common-mistakes-to-avoid)

## Prime and Composite at a Glance

A **prime number** has exactly two positive factors: $1$ and itself.

A **composite number** has more than two positive factors.

Examples:

- Prime: $2,3,5,7,11$
- Composite: $4,6,8,9,10,12$

In a factor tree, composite numbers keep splitting into smaller factors, while prime numbers are the endpoints (leaves).

## Build a Factor Tree

Start with a composite number, such as $84$.

Choose any two factors of $84$, then keep factoring each composite result until every leaf is prime.

One valid path is:

$$
84=12\cdot7=(3\cdot4)\cdot7=3\cdot(2\cdot2)\cdot7
$$

<figure style="margin:1.25rem 0;display:flex;justify-content:center">
<svg viewBox="0 0 420 280" width="420" height="280" style="max-width:100%;height:auto" role="img" aria-label="Factor tree for 84">
  <!-- edges -->
  <line x1="240" y1="48" x2="150" y2="86" stroke="#64748b" stroke-width="1.8"/>
  <line x1="240" y1="48" x2="330" y2="86" stroke="#64748b" stroke-width="1.8"/>
  <line x1="150" y1="122" x2="110" y2="160" stroke="#64748b" stroke-width="1.8"/>
  <line x1="150" y1="122" x2="190" y2="160" stroke="#64748b" stroke-width="1.8"/>
  <line x1="190" y1="196" x2="160" y2="234" stroke="#64748b" stroke-width="1.8"/>
  <line x1="190" y1="196" x2="220" y2="234" stroke="#64748b" stroke-width="1.8"/>
  <!-- internal nodes: 84, 12, 4 -->
  <circle cx="240" cy="30" r="18" fill="rgba(45,212,191,0.22)" stroke="rgba(15,23,42,0.32)" stroke-width="1.5"/>
  <text x="240" y="35" text-anchor="middle" font-size="14" font-weight="600" fill="#0f172a">84</text>
  <circle cx="150" cy="104" r="18" fill="rgba(45,212,191,0.22)" stroke="rgba(15,23,42,0.32)" stroke-width="1.5"/>
  <text x="150" y="109" text-anchor="middle" font-size="14" font-weight="600" fill="#0f172a">12</text>
  <circle cx="190" cy="178" r="18" fill="rgba(45,212,191,0.22)" stroke="rgba(15,23,42,0.32)" stroke-width="1.5"/>
  <text x="190" y="183" text-anchor="middle" font-size="14" font-weight="600" fill="#0f172a">4</text>
  <!-- leaf nodes (primes): 7, 3, 2, 2 -->
  <circle cx="330" cy="104" r="18" fill="rgba(14,165,233,0.2)" stroke="rgba(15,23,42,0.32)" stroke-width="1.5"/>
  <text x="330" y="109" text-anchor="middle" font-size="14" font-weight="600" fill="#0f172a">7</text>
  <circle cx="110" cy="178" r="18" fill="rgba(14,165,233,0.2)" stroke="rgba(15,23,42,0.32)" stroke-width="1.5"/>
  <text x="110" y="183" text-anchor="middle" font-size="14" font-weight="600" fill="#0f172a">3</text>
  <circle cx="160" cy="252" r="18" fill="rgba(14,165,233,0.2)" stroke="rgba(15,23,42,0.32)" stroke-width="1.5"/>
  <text x="160" y="257" text-anchor="middle" font-size="14" font-weight="600" fill="#0f172a">2</text>
  <circle cx="220" cy="252" r="18" fill="rgba(14,165,233,0.2)" stroke="rgba(15,23,42,0.32)" stroke-width="1.5"/>
  <text x="220" y="257" text-anchor="middle" font-size="14" font-weight="600" fill="#0f172a">2</text>
</svg>
</figure>

In this tree, <span style="color:#0f766e;font-weight:600">green nodes</span> are composite numbers and <span style="color:#0284c7;font-weight:600">blue nodes</span> are prime numbers.

At the end of the tree, each leaf is prime, so the decomposition is complete.

## Read the Prime Factorization

Read only the prime leaves and multiply them:

$$
84=2\cdot2\cdot3\cdot7=2^2\cdot3\cdot7
$$

You can build different tree shapes, but the final prime factorization is always the same (up to order).

For example, for $72$:

$$
72=2\cdot2\cdot2\cdot3\cdot3=2^3\cdot3^2
$$

## Why This Process Always Works

Every composite number can be broken into smaller factors.

If you continue splitting composites, eventually you must land on primes. Those prime leaves form the prime factorization.

This is useful for:

- simplifying radicals
- finding greatest common factors
- finding least common multiples
- simplifying rational expressions later in algebra

## Try the Integrated Factor Tree Practice

The tool below has two modes:

- **Explore:** Enter any whole number from $2$ to $1000$ and generate a full factor tree.
- **Integrated Practice:** Type factor pairs directly into the empty child nodes of the tree and check each split in place.

Color key in the visualization:

- **Green nodes:** composite numbers
- **Blue nodes:** prime numbers

<div class="not-prose my-8 rounded-2xl border border-border/70 bg-card/70 p-4">
	<LazyPostToolEmbed
		toolId="prime-factorization-factor-tree-lab"
		title="Prime Factorization Factor Tree Lab"
	/>
</div>

## Common Mistakes to Avoid

1. Stopping before every leaf is prime.
2. Using a pair that does not multiply to the parent node.
3. Including composite numbers in the final factorization line.
4. Forgetting repeated primes (for example, writing $2\cdot3\cdot7$ instead of $2\cdot2\cdot3\cdot7$ for $84$).

When students follow this workflow consistently, prime/composite classification and prime factorization become straightforward and reliable.
