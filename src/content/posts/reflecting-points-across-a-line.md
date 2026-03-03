---
title: 'Reflecting Points Across a Line'
subtitle: 'Or: How I Learned to Stop Worrying and Trust the Process'
excerpt: 'A walkthrough of reflecting points across a line, with interactive visualizations.'
publishedOn: 'February 28, 2026'
publishedAt: '2026-02-28'
readTime: '25 min'
author: 'Max'

tags:
  - geometry
  - transformations
  - algebra
equation: 'y=mx+b'
featured: true
---

<script>
	import ReflectionOverHorizontalLineVisual from '$lib/components/math/reflection-over-horizontal-line-visual.svelte';
	import ReflectionOverYEqualsMxPlusBStepsVisual from '$lib/components/math/reflection-over-y-equals-mx-plus-b-steps-visual.svelte';
	import ReflectionOverVerticalLineVisual from '$lib/components/math/reflection-over-vertical-line-visual.svelte';
	import ReflectionOverYEqualsXVisual from '$lib/components/math/reflection-over-y-equals-x-visual.svelte';
	import ReflectionOverYEqualsXPlusBVisual from '$lib/components/math/reflection-over-y-equals-x-plus-b-visual.svelte';
	import ReflectionOverYEqualsXPlusBThreeStepShiftVisual from '$lib/components/math/reflection-over-y-equals-x-plus-b-three-step-shift-visual.svelte';
</script>

Let's talk about **reflections over a line**. This is a topic that comes up in geometry and can usually be solved through visual inspection.

We know that a point and its reflection are the same distance away from the line of reflection. Thus, we can solve for the reflected point by counting how far away the point of interest is from the line of reflection, and then counting that same distance on the other side to plot the reflected image.

However, as clever math students we can figure out a few general rules and tricks to speed up the process... in most cases :)


# Simple Reflections

For these examples, visual inspection is usually enough. But as you'll see, when we tilt our line of reflection, there will be a nice shortcut.

## Horizontal Lines: $y=k$

Suppose we have some point, $P = (x, y)$, and a horizontal line of reflection, $y=k$. Because $y=k$ is a horizontal line, the distance between the point and the line is completely determined by their $y$-coordinates. Therefore, the point $P$ is $|y-k|$ units away from the line. And because the reflected point will be the same distance away from the line on the opposite side, the reflected point will sit $|y-k|$ units away from the line on the opposite side.

In other words, we can pretty much count how far away $P$ is from the line, and then just count the same distance on the other side to plot the reflected image.

In fact, if we have line of reflection $y=0$, then the reflected point is simply $P' = (x, -y)$!

<div class="not-prose my-8 rounded-2xl border border-border/70 bg-card/70 p-4">
	<ReflectionOverHorizontalLineVisual />
</div>

We can actually derive an exact algebraic formula for the reflected point. Let's call the reflected point $P' = (x', y')$. The original point $P$ is a distance of $|y-k|$ units away from the line. The reflected point $P'$ is also a distance of $|y'-k|$ units away from the line on the other side. Because the reflected point is the same distance away from the line as the original point, we can equate them and solve for $y'$:

$$
|y-k| = |y'-k|
$$

Because we know that line $y=k$ is horizontal, it must sit in between the two points. Without loss of generality, we will assume that $y > k > y'$, so that the reflected point is below the line of reflection. Then $y - k > 0$ and $y' - k < 0$ (before taking the absolute values, one side will be positive and the other will be negative). But because we're taking absolute values, we can rewrite the order of the expressions (e.g., $|-23| = |23| = 23$)!

$$
|y'-k| = |k - y|
$$

So we find that

$$
|y-k| = |y'-k|
\\
|y-k| = |k - y'|
\\
y-k = k-y'
\\
y' = 2k-y
$$


Then, in general, when reflecting a point $P = (x, y)$ across a horizontal line $y=k$, the reflected point is located at:
$$
\boxed{P' = (x, 2k-y)}
$$

## Vertical Lines: $x=k$

Great! That wasn't too bad. Now we'll move on to vertical lines, which follow the same pattern. 

Suppose we have some point, $P = (x, y)$, and a vertical line of reflection, $x=k$. Because $x=k$ is a vertical line, the distance between the point and the line is completely determined by their $x$-coordinates. Therefore, the point $P$ is $|x-k|$ units away from the line. And because the reflected point will be the same distance away from the line on the opposite side, the reflected point will sit $|x-k|$ units away from the line on the opposite side.

We have the same situation as above, but in the $x$-direction instead of the $y$-direction.

And, for example, if we have line of reflection $x=0$, then the reflected point is simply $P' = (-x, y)$!

<div class="not-prose my-8 rounded-2xl border border-border/70 bg-card/70 p-4">
	<ReflectionOverVerticalLineVisual />
</div>

**Now you try!** Try deriving the general formula for reflecting a point across a vertical line $x=k$ using the same method as above.

<details class="rounded-xl border border-border/70 bg-background/70 p-4">
<summary class="cursor-pointer text-sm font-semibold text-foreground">Reveal solution</summary>

We have point $P = (x, y)$ and reflected point $P' = (x', y')$. The original point $P$ is a distance of $|x-k|$ units away from the line. The reflected point $P'$ is a distance of $|x'-k|$ units away from the line on the other side. Because the reflected point is the same distance away from the line as the original point, we can equate them and solve for $x'$:

$$
|x-k| = |x'-k|
\\
|x-k| = |k - x'|
\\
x-k = k-x'
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

First, let's try to solve this problem visually. We count how far away our point $P$ is from the line $y=x$ in the $x$-direction, and then plot the reflected point $P'$ the same distance away in the $y$-direction on the other side of the line.

<div class="not-prose my-8 rounded-2xl border border-border/70 bg-card/70 p-4">
	<ReflectionOverYEqualsXVisual />
</div>

But what if we have a weird point at $(2\sqrt{2}, \pi)$ that's difficult to count? Now it's time to learn a quick trick that will save you a lot of time! We can use a bit of handwaving to figure this out.

We know that a horizontal line of reflection at $y=0$ completely flips the sign of the $y$-coordinate, and a that a vertical line of reflection at $x=0$ flips the sign of the $x$-coordinate. Then, naturally, a diagonal line in between at $y=x$ flips both the $x$- and $y$-coordinates, resulting in a swap! The proof is left as an exercise to the reader :)

So, the reflected point is located at:

$$
\boxed{P' = (y, x)}
$$

## Shifted Diagonal Lines: $y=x + b$

This one is a bit more tricky, but it will serve us well to wrap our heads around it before we dive into the general case.

We know that if we could just make this problem be a reflection in $y=x$ instead of $y=x+b$, then it would be trivial to solve -- just swap the $x$- and $y$-coordinates!

So, why not try exactly that? Let's reframe this difficult problem into in easier one. We need to turn $y=x+b$ into $y=x$, and back then back again. But how do we do that?

<div class="not-prose my-8 rounded-2xl border border-border/70 bg-card/70 p-4">
	<ReflectionOverYEqualsXPlusBThreeStepShiftVisual />
</div>

Well, we can start by subtracting the $b$ from the $y$-coordinate of the line of reflection $y=x+b$ to move it up/down to the origin. Anything we do to the line of reflection, we'll have to do to the point of interest, $P$, to keep the problem consistent. It's like we're dragging everything up/down by $b$ units.

$$
y=x+b \ \Rightarrow \ y=x
$$

$$
P = (x, y) \ \Rightarrow \ P = (x, y-b)
$$

Now that we have a line of reflection at $y=x$, we can reflect the point across it as usual by swapping the $x$- and $y$-coordinates.

$$
P = (x, y-b) \ \Rightarrow \ P' = (y-b, x)
$$

Now we need to push everything back in place by adding $b$ back to the $y$-coordinates.

$$
y = x \ \Rightarrow \ y = x + b
$$

$$
P' = (y-b, x) \ \Rightarrow \ P' = (y-b, x+b)
$$

So, we find that the reflected point is located at:

$$
\boxed{P' = (y-b, x+b)}
$$

<div class="not-prose my-8 rounded-2xl border border-border/70 bg-card/70 p-4">
	<ReflectionOverYEqualsXPlusBVisual />
</div>


# General Reflections

## Rotation Matrices

We'll be taking a slight detour to talk about rotation matrices -- basically, a set of numbers that represent how we can rotate a point about the origin. This is a little advanced (you'll see it come up in linear algebra, which, among other things, formalizes the concept of transformations like reflections and rotations using matrices) so feel free to skip this section.

The general rotation matrix for rotating a point about the origin by an angle $\theta$ in the clockwise direction is:
$$
R(\theta) =
\begin{pmatrix}
\cos(\theta) & \sin(\theta) \\
-\sin(\theta) & \cos(\theta)
\end{pmatrix}
$$

where $\theta$ is the angle between the line of reflection and the x-axis.

For any point $P = (x, y)$, which we can represent as a column vector, the rotated point $P'$ is given by:
$$
P' = R(\theta)P
$$

For example, say we have point $P = (0, 1)$ and we want to rotate it by $\theta = 90^\circ$ clockwise. We'd expect it to land at $P' = (1, 0)$. Let's check:
$$
\begin{align*}
P' &= R(\theta)P 
\\
 &= R(90^\circ)
\begin{pmatrix}
0 \\
1
\end{pmatrix} \\
&= \begin{pmatrix}
\cos(90^\circ) & \sin(90^\circ) \\
-\sin(90^\circ) & \cos(90^\circ)
\end{pmatrix} \begin{pmatrix}
0 \\
1
\end{pmatrix}
\\[1em]
&= \begin{pmatrix}
0 & 1 \\
-1 & 0
\end{pmatrix} \begin{pmatrix}
0 \\
1
\end{pmatrix}
\\[1em]
&= \begin{pmatrix}
0 \cdot 0 + 1 \cdot 1 \\
-1 \cdot 0 + 0 \cdot 1
\end{pmatrix}
\\[1em]
&= \begin{pmatrix}
1 \\
0
\end{pmatrix}
\\[1em]
&= (1, 0)
\end{align*}
$$

So, we see that rotating a point $P = (0, 1)$ by $\theta = 90^\circ$ clockwise results in the point $P' = (1, 0)$.

Rotation matrices and vector operations will be discussed in more detail in a future post.

## General Lines: $y=mx+b$

Now let's do something crazy :)

Say we want to find out how to reflect a point $P = (x, y)$ across some general line $y=mx+b$. We might be able to do this through visual inspection, but it can be pretty difficult, especially for points not on lattice points. Instead, we aim to derive a general formula for the reflected point.

Let's think back to our simple reflections. It would be so nice if we could somehow turn this general line $y=mx+b$ into the simple horizontal line $y=0$, where the rule is to simply flip the sign of the $y$-coordinate, $P' = (x, -y)$. Hmm... we've found ourselves in a [similar situation before](#shifted-diagonal-lines-yx--b)!

Recall, when we were dealing with the diagonal line $y=x + b$, we found that we could subtract off the $b$ to move the line to the origin, reframing the problem into a simple reflection across the line $y=x$. We'll take a similar, albeit slightly more involved, approach here. It might be worthwhile to pause here and make sure you understand the steps we took to simplify the $y=x+b$ problem before continuing.

The general procedure to *"simplify"* the problem is as follows:
1. Translate the line of reflection $y=mx+b$ to the origin by subtracting off the $b$. Anything we do to the line of reflection, we must do to $P$, so we also subtract off $b$ from $P$'s $y$-component.

$$
\begin{align*}
y &= mx
\\
P &\leftarrow (x, y-b)
\end{align*}
$$

2. Rotate point $P$ and the line of reflection $y=mx$ by a clockwise angle $\theta$ using our rotation matrix $R(\theta)$. This will rotate the line onto the x-axis, making it the horizontal line $y=0$.

$$
\begin{align*}
y &=0 \\
P &\leftarrow R(\theta)P
\end{align*}
$$


3. Reflect point $P$ across the x-axis by flipping the sign of the $y$-coordinate to find the reflected point $P'$.

$$
P' = (P_x, -P_y)
$$

4. Rotate the line of reflection back to its original slope, $y=mx$, by a counter-clockwise angle $\theta$. We can rotate point $P'$ back into this frame by multiplying be the inverse rotation matrix $R(-\theta)$.

$$
\begin{align*}
y &= mx \\
P' &\leftarrow R(-\theta)P'
\end{align*}
$$

5. Translate the line of reflection back to its original position, $y=mx+b$, by adding back the $b$. And of course, we must do the same to point $P'$ to keep the problem consistent.

$$
\begin{align*}
y &= mx + b \\
P' &\leftarrow (P'_x, P'_y + b)
\end{align*}
$$

<div class="not-prose my-8 rounded-2xl border border-border/70 bg-card/70 p-4">
	<ReflectionOverYEqualsMxPlusBStepsVisual />
</div>


Okay... nice procedure, but that's not very helpful! We could manually perform this (or more likely write a program to do it for us), but why go through all this trouble everytime we want to reflect a point?!

If we could find a formula that would give us the reflected point directly, we could use it to easily **reflect any point across any line**! What follows is exactly that derivation. Brace yourself -- this is not for the faint of heart!

<details class="rounded-xl border border-border/70 bg-background/70 p-4">
<summary class="cursor-pointer text-sm font-semibold text-foreground">Full derivation... here it comes!</summary>

Tricked ya! Work in progress :)

</details>

Wow! Glad that's over :) Welcome back! 

To review, we found that given a point $P = (x, y)$ and a line $y=mx+b$, the reflected point is located at:
$$
P' = \left(\frac{(1-m^2)x + 2m(y-b)}{m^2+1}, \frac{2mx + (m^2-1)(y-b)}{m^2+1} + b\right)
$$

Now we can just plug and chug to find any reflected point across any line.


## Recovering the rules for simple reflections

How do we know this crazy formula is correct? Well, because this is the general formula for *any* line $y=mx+b$, it should work for any particular line we choose to throw at it. Let's try a few:

**Horizontal line:** $y=k$

We know the reflected point should be $P' = (x, 2k-y)$. A horizontal line has slope of zero, so we can plug in $m=0$ and $b=k$ to see if we get the correct answer:
$$
\begin{align*}
P' &= \left(\frac{(1-m^2)x + 2m(y-b)}{m^2+1}, \frac{2mx + (m^2-1)(y-b)}{m^2+1} + b\right)
\\[1em]
 &= \left(\frac{(1-0^2)x + 2(0)(y-k)}{0^2+1}, \frac{2(0)x + (0^2-1)(y-k)}{0^2+1} + k\right)
\\[1em]
&= \left(\frac{x}{1}, \frac{-(y-k)}{1} + k\right)
\\[1em]
 &= \left(x, -y + k + k\right)
\\[1em]
 &= \left(x, 2k - y\right)
\\[1em]
\end{align*}
$$

**Diagonal line:** $y=x$

We know the reflected point should be $P' = (y, x)$. This line has slope $m=1$ and intercept $b=0$:
$$
\begin{align*}
P' &= \left(\frac{(1-m^2)x + 2m(y-b)}{m^2+1}, \frac{2mx + (m^2-1)(y-b)}{m^2+1} + b\right)
\\[1em]
 &= \left(\frac{(1-1^2)x + 2(1)(y-0)}{1^2+1}, \frac{2(1)x + (1^2-1)(y-0)}{1^2+1} + 0\right)
\\[1em]
&= \left(\frac{2y}{2}, \frac{2x}{2}\right)
\\[1em]
 &= \left(y, x\right)
\\[1em]
\end{align*}
$$

Awesome! So, as we can see, the formula works! But it would still be a pain to manually compute every point by hand.

## Desmos

Instead, we can enter the reflection formula into Desmos and let it do all the heavy lifting. Try dragging the purple point $P$ to see the reflected point $P'$ update in real time.

You can tinker around with the graph more [here](https://www.desmos.com/calculator/ajdr4a4hck).

<div class="not-prose my-8 overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-3">
  <div class="aspect-square w-full overflow-hidden rounded-xl border border-border/60 bg-white">
    <iframe
      src="https://www.desmos.com/calculator/ajdr4a4hck?embed"
      title="Interactive Desmos graph for reflecting a point across a line"
      class="h-full w-full"
      frameborder="0"
      loading="lazy"
    ></iframe>
  </div>
</div>


# Reflections Cheat Sheet

For a point $P=(x,y)$:

**Horizontal line:** $y=k$
$$
P'=(x,2k-y)
$$

**Vertical line:** $x=k$
$$
P'=(2k-x,y)
$$

**Diagonal line:** $y=x$
$$
P'=(y,x)
$$

**Shifted diagonal:** $y=x+b$
$$
P'=(y-b,x+b)
$$


**General line:** $y=mx+b$
$$
x' = \frac{(1-m^2)x + 2m(y-b)}{m^2+1},\qquad
y' = \frac{2mx + (m^2-1)(y-b)}{m^2+1} + b
$$
