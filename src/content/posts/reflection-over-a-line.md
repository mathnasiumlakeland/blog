---
title: 'Reflection Over a Line'
subtitle: 'Visualizing geometric reflection with an interactive graph'
excerpt: 'Explore how points mirror across a line using an embedded Desmos construction.'
publishedOn: 'February 28, 2026'
publishedAt: '2026-02-28'
readTime: '3 min'
tags:
  - geometry
  - transformations
  - desmos
equation: 'P_{ref} = P - 2\frac{(P-P_0)\cdot n}{\|n\|^2}n'
featured: false
---

In this post, we visualize how a point reflects across a line.

<div style="width:min(100%, 820px); margin:0 auto;">
	<iframe
		src="https://www.desmos.com/calculator/ajdr4a4hck?embed"
		style="display:block; width:100%; aspect-ratio:1 / 1; height:auto; border:1px solid #ccc;"
		frameborder="0"
	></iframe>
</div>

For a line with point $P_0$ and normal vector $n$, the reflected point of $P$ is:

$$
P' = P - 2\frac{(P-P_0)\cdot n}{\|n\|^2}n
$$
