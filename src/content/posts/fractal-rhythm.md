---
title: "Lissajous Curves And Harmonic Motion"
subtitle: "When frequency ratios draw art"
excerpt: "Animated parametric curves show how tiny ratio shifts transform shape, rhythm, and symmetry."
publishedOn: "February 14, 2026"
publishedAt: "2026-02-14"
readTime: "5 min"
tags:
  - trigonometry
  - animation
  - geometry
equation: 'x = \sin(at+\delta),\; y = \sin(bt)'
---

<script>
	import LissajousCanvas from '$lib/components/math/lissajous-canvas.svelte';
</script>

Lissajous curves are one of the nicest examples of a deep idea wearing a simple face. Two sine waves, one for each axis, are enough to produce a wide spectrum of geometric behavior.

A compact inline form is $x=\sin(at+\delta),\; y=\sin(bt)$.

When the ratio $a:b$ is rational, the curve eventually closes. When it drifts away, the figure sweeps through denser patterns.

<div class="not-prose my-8 rounded-2xl border border-border/70 bg-card/70 p-4">
	<LissajousCanvas />
</div>

## Reading the structure

You can treat the drawing as a frequency map. Increasing one axis frequency increases the number of lobes in that direction.

The phase term shifts the figure and changes where crossings happen, linking visual form directly to parameter values.
