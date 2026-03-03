---
title: 'The Pythagorean Identity'
subtitle: 'One of the most important trigonometric identities'
excerpt: 'A simple visual proof of the Pythagorean identity.'
publishedOn: 'March 3, 2026'
publishedAt: '2026-03-03'
readTime: '3 min'
author: 'Max'
tags:
  - trigonometry
  - unit-circle
  - identities
  - geometry
equation: '\sin^2\theta + \cos^2\theta = 1'
featured: false
devOnly: false
---

<script>
	import UnitCircleSineCosineIdentityVisual from '$lib/components/math/unit-circle-pythagorean-identity-visual.svelte';
</script>

The Pythagorean identity is first encountered in geometry / pre-calc, but doesn't seem that interesting at first. However, it turns out to be one of the more important trig identities that keeps popping up in all sorts of interesting places down the line. Let's figure out where it comes from.

Pick a point along the circumference of the unit circle and call it $(x, y)$. Since the unit circle is defined to have a radius of $r=1$, we know that any such point is just a distance of $1$ away from the origin.

Notice that this point forms a right triangle with the axes. The legs have lengths $x$ and $y$, and the hypotenuse has a length of $1$.


<div class="not-prose my-8 rounded-2xl border border-border/70 bg-card/70 p-4">
	<UnitCircleSineCosineIdentityVisual />
</div>

Let the the interior angle between the radius and the $x$-axis be $\theta$. From our trig ratios, we know that:

$$
\cos\theta=\frac{\text{adjacent}}{\text{hypotenuse}}=\frac{x}{1}=x,
\qquad
\sin\theta=\frac{\text{opposite}}{\text{hypotenuse}}=\frac{y}{1}=y.
$$

And we also know by the Pythagorean theorem that:

$$
x^2+y^2=1.
$$

So, if we substitute in $x=\cos\theta$ and $y=\sin\theta$, we find that:

$$
\sin^2\theta+\cos^2\theta=1.
$$

Pretty neat!
