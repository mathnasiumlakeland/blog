---
title: "Newton's Method With WebAssembly"
subtitle: "Fast polynomial roots in the browser"
excerpt: "We compile a tiny C kernel to WebAssembly and use it to drive an interactive root-finding explorer."
publishedOn: "February 28, 2026"
publishedAt: "2026-02-28"
readTime: "8 min"
tags:
  - wasm
  - numerical methods
  - visualization
equation: 'x_{n+1} = x_n - f(x_n)/f^\prime(x_n)'
featured: true
---

<script>
	import WasmPolynomialExplorer from '$lib/components/math/wasm-polynomial-explorer.svelte';
</script>

Newton's method is already elegant in pure JavaScript, but this experiment pushes the core kernel into WebAssembly.

Inline math works with standard LaTeX-style delimiters, for example $x_{n+1}=x_n-\frac{f(x_n)}{f^\prime(x_n)}$, and block math renders as:

$$
x_{n+1} = x_n - \frac{f(x_n)}{f^\prime(x_n)}
$$

This also feels natural for Typst-like writing flow because you can use `$...$` inline without extra ceremony.

<div class="not-prose my-8 rounded-2xl border border-border/70 bg-card/70 p-4">
	<WasmPolynomialExplorer />
</div>

## Why use WASM here?

This specific kernel is small, but it demonstrates a clean architecture for heavier numerical work: keep rendering and controls in Svelte while moving tight numeric loops into a compact binary module.

Because this site is static, deployment remains simple. The `.wasm` file is shipped as a static asset and fetched on demand.
