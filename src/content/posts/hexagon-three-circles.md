---
title: 'Hexagon With Three Unit Circles'
subtitle: 'Area inside the hexagon, outside the circles'
excerpt: 'A symmetry-first geometry derivation for a regular hexagon with unit circles centered at alternating vertices.'
publishedOn: 'February 28, 2026'
publishedAt: '2026-02-28'
readTime: '6 min'
tags:
  - geometry
  - symmetry
  - area
equation: 'A=2\sqrt{3}-\pi'
---

<script>
	import HexagonTriangleAreaVisual from '$lib/components/math/hexagon-triangle-area-visual.svelte';
	import HexagonThreeCirclesVisual from '$lib/components/math/hexagon-three-circles-visual.svelte';
	import PolygonTriangulationVisual from '$lib/components/math/polygon-triangulation-visual.svelte';
	import RegularInteriorAngleVisual from '$lib/components/math/regular-interior-angle-visual.svelte';
	import SectorFractionVisual from '$lib/components/math/sector-fraction-visual.svelte';
</script>

Place three unit circles ($r=1$) at alternating vertices ($A,C,E$) of a regular hexagon.  
We choose the hexagon size so the circles are just tangent (touching, not overlapping).

If the hexagon side length is $n$, then the distance between alternating vertices is:

$$
\sqrt{3}\,n
$$

Tangency of unit circles means center distance $=2$, so:

$$
\sqrt{3}\,n=2
\quad\Rightarrow\quad
n=\frac{2}{\sqrt{3}}
$$

Now compute area inside the hexagon but outside those circles.

<div class="not-prose my-8 rounded-2xl border border-border/70 bg-card/70 p-4">
	<HexagonThreeCirclesVisual />
</div>

## 1) Sum of interior angles (general formula)

<div class="not-prose my-6 rounded-2xl border border-border/70 bg-card/70 p-4">
	<PolygonTriangulationVisual />
</div>

For any $n$-gon:

$$
\text{Sum of interior angles} = (n-2)\cdot 180^\circ
$$

Example: for a pentagon ($n=5$), the sum is $(5-2)\cdot 180^\circ = 540^\circ$.

## 2) Single interior angle for a regular polygon

<div class="not-prose my-6 rounded-2xl border border-border/70 bg-card/70 p-4">
	<RegularInteriorAngleVisual />
</div>

$$
\theta_n=\frac{(n-2)\cdot 180^\circ}{n}
$$

For a regular hexagon ($n=6$):

$$
\theta_6=\frac{(6-2)\cdot 180^\circ}{6}=120^\circ
$$

## 3) Sector fraction of a unit circle

<div class="not-prose my-6 rounded-2xl border border-border/70 bg-card/70 p-4">
	<SectorFractionVisual />
</div>

Since $120^\circ$ is one third of $360^\circ$, one interior sector at a chosen vertex is:

$$
\frac{\theta}{360^\circ}\pi r^2
\quad\Rightarrow\quad
\frac{120^\circ}{360^\circ}\pi(1)^2=\frac{\pi}{3}
$$

Three such sectors give total circle contribution:

$$
3\cdot\frac{\pi}{3}=\pi
$$

## 4) Hexagon area from six equilateral triangles

<div class="not-prose my-6 rounded-2xl border border-border/70 bg-card/70 p-4">
	<HexagonTriangleAreaVisual />
</div>

A regular hexagon splits into 6 equilateral triangles, each with side length $n$.

Using a right-triangle split:

$$
h=\sqrt{n^2-\left(\frac{n}{2}\right)^2}=\frac{\sqrt3}{2}n
$$

Triangle area:

$$
\frac12\cdot n\cdot \frac{\sqrt3}{2}n=\frac{\sqrt3}{4}n^2
$$

Hexagon area:

$$
6\cdot\frac{\sqrt3}{4}n^2=\frac{3\sqrt3}{2}n^2
$$

For the tangent-unit-circle configuration $n=\frac{2}{\sqrt3}$:

$$
H_{\text{tan}}=\frac{3\sqrt3}{2}\left(\frac{2}{\sqrt3}\right)^2=2\sqrt3
$$

## 5) Subtract circle-sector total

<div class="not-prose my-6 rounded-2xl border border-border/70 bg-card/70 p-4">
	<HexagonThreeCirclesVisual />
</div>

Using the sector total from step 3:

$$
A(n)=\frac{3\sqrt3}{2}n^2-\pi
$$

At tangency $n=\frac{2}{\sqrt3}$:

$$
A_{\text{tan}}=2\sqrt3-\pi
$$

This is exact at tangency (the circles only meet at points, so there is no overlap area to correct).
