---
title: 'Reflection Over a Line'
subtitle: 'Visualizing geometric reflection with an interactive graph'
excerpt: 'Explore how points mirror across a line using an embedded Desmos construction.'
publishedOn: 'February 28, 2026'
publishedAt: '2026-02-28'
readTime: '3 min'
author: 'Max'

tags:
  - geometry
  - transformations
  - algebra
equation: 'y=mx+b'
featured: false
---

<script>
	import ReflectionOverHorizontalLineVisual from '$lib/components/math/reflection-over-horizontal-line-visual.svelte';
	import ReflectionOverYEqualsMxPlusBStepsVisual from '$lib/components/math/reflection-over-y-equals-mx-plus-b-steps-visual.svelte';
	import ReflectionOverVerticalLineVisual from '$lib/components/math/reflection-over-vertical-line-visual.svelte';
	import ReflectionOverYEqualsXVisual from '$lib/components/math/reflection-over-y-equals-x-visual.svelte';
	import ReflectionOverYEqualsXPlusBVisual from '$lib/components/math/reflection-over-y-equals-x-plus-b-visual.svelte';
</script>

Let's talk about **reflections over a line**. This is a topic that comes up in geometry, and can usually be solved visually by counting how far away the point of interest is from the line of reflection. 


If you're a visual learner, you can just imagine a mirror placed along the line $y=x$ and then imagine the point being reflected across the mirror.


However, as clever math students we should always search for / strive for


# Simple Reflections

For these example, we can pretty much count how far away a point it from the line of reflection and then just count the same distance on the other side to plot the reflected image.

## Horizontal Lines: $y=k$

Suppose we have some point, $P = (x, y)$, and a horizontal line of reflection, $y=k$. Because $y=k$ is a horizontal line, the distance between the point and the line is completely determined by their $y$-coordinates. Therefore, the point $P$ is $|y-k|$ units away from the line. And because the reflected point will be the same distance away from the line on the opposite side, the reflected point will sit $|y-k|$ units away from the line on the opposite side.

In other words, we can pretty much count how far away $P$ is from the line, and then just count the same distance on the other side to plot the reflected image.

<div class="not-prose my-8 rounded-2xl border border-border/70 bg-card/70 p-4">
	<ReflectionOverHorizontalLineVisual />
</div>

We can actually derive an exact algebraic formula for the reflected point. Let's call the reflected point $P' = (x', y')$. The original point $P$ is a distance of $|y-k|$ units away from the line. The reflected point $P'$ is a distance of $|y'-k|$ units away from the line on the other side. Because the reflected point is the same distance away from the line as the original point, we can equate them and solve for $y'$:

$$
|y-k| = |y'-k|
\\
y'-k = k-y
\\
y' = 2k-y
$$


So, in general, when reflecting a point $P = (x, y)$ across a horizontal line $y=k$, the reflected point is located at:
$$
\boxed{P' = (x, 2k-y)}
$$

## Vertical Lines: $x=k$

Great! That wasn't too bad. Now we'll move on to vertical lines, which follow the same pattern.

Suppose we have some point, $P = (x, y)$, and a vertical line of reflection, $x=k$. Because $x=k$ is a vertical line, the distance between the point and the line is completely determined by their $x$-coordinates. Therefore, the point $P$ is $|x-k|$ units away from the line. And because the reflected point will be the same distance away from the line on the opposite side, the reflected point will sit $|x-k|$ units away from the line on the opposite side.

<div class="not-prose my-8 rounded-2xl border border-border/70 bg-card/70 p-4">
	<ReflectionOverVerticalLineVisual />
</div>

**Now you try!** Try deriving the general formula for reflecting a point across a vertical line $x=k$ using the same method as above.

<details class="rounded-xl border border-border/70 bg-background/70 p-4">
<summary class="cursor-pointer text-sm font-semibold text-foreground">Reveal solution</summary>

We have point $P = (x, y)$ and reflected point $P' = (x', y')$. The original point $P$ is a distance of $|x-k|$ units away from the line. The reflected point $P'$ is a distance of $|x'-k|$ units away from the line on the other side. Because the reflected point is the same distance away from the line as the original point, we can equate them and solve for $x'$:

$$
|x-k| = |x'-k|
$$

$$
x'-k = k-x
\\
x' = 2k-x
$$

So, in general, when reflecting a point $P = (x, y)$ across a vertical line $x=k$, the reflected point is located at:

$$
\boxed{P' = (2k-x, y)}
$$

</details>

## Diagonal Line: $y=x$

Now let's move on to something a bit more interesting. How do we reflect a point across the line $y=x$?

First, let's try to solve this problem visually. We can imagine a mirror placed along the line $y=x$ and then imagine the point being reflected across the mirror.

We count how far away the point is from the line and then count the same distance on the other side to plot the reflected image.

<div class="not-prose my-8 rounded-2xl border border-border/70 bg-card/70 p-4">
	<ReflectionOverYEqualsXVisual />
</div>

If you're a more algebraic learner, you can use the following method:

To reflect a point across the line $y=x$, we need to find the line that is perpendicular to $y=x$ and passes through the point. The line that is perpendicular to $y=x$ is $y=-x$. And the line that passes through the point is $y=x$.

So, the reflected point is the point where the line $y=-x$ intersects the line $y=x$.

So, the reflected point is located at:

$$
\boxed{P' = (y, x)}
$$

## Shifted Diagonal Lines: $y=x + b$

This follows the same idea as reflecting across $y=x$, but now the mirror is shifted up or down by $b$ units.

A useful way to think about it is: reflect as if the mirror were $y=x$, but account for the shift.
The reflected point is:

$$
\boxed{P' = (y-b,\ x+b)}
$$

<div class="not-prose my-8 rounded-2xl border border-border/70 bg-card/70 p-4">
	<ReflectionOverYEqualsXPlusBVisual />
</div>

You can use the horizontal and vertical helper distances (`|dx|` and `|dy|`) the same way as the $y=x$ visual.

# General Reflections

## Rotation Matrices

The rotation matrix for reflection over the line $y=x$ is:

$$
\begin{pmatrix}
0 & 1 \\
1 & 0
\end{pmatrix}
$$

## General Lines: $y=mx+b$

Now let's do something crazy :)

This is the full derivation workflow you outlined:
translate by $-b$, rotate by $-\theta$, reflect across $y=0$, rotate back by $+\theta$, then translate by $+b$.

Use the stepper below with the **Back** and **Forward** controls.

<div class="not-prose my-8 rounded-2xl border border-border/70 bg-card/70 p-4">
	<ReflectionOverYEqualsMxPlusBStepsVisual />
</div>

For a line with point $P_0$ and normal vector $n$, the reflected point of $P$ is:

$$
P' = P - 2\frac{(P-P_0)\cdot n}{\|n\|^2}n
$$

## Recovering the rules for simple reflections


# Reflections Cheat Sheet

For a point $P=(x,y)$:

**Horizontal line** $y=k$
$$
P'=(x,2k-y)
$$

**Vertical line** $x=k$
$$
P'=(2k-x,y)
$$

**Diagonal line** $y=x$
$$
P'=(y,x)
$$

**Shifted diagonal** $y=x+b$
$$
P'=(y-b,x+b)
$$


**General line** $y=mx+b$
$$
x' = x-\frac{2m(mx-y+b)}{m^2+1},\qquad
y' = y+\frac{2(mx-y+b)}{m^2+1}
$$
