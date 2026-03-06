---
title: "Don't Mix Up Mixtures"
subtitle: 'Use A and p balances to solve mixture percent problems'
excerpt: 'Track total amount and total Ap (amount times percent) to solve mixture questions like 10 cups at 20% plus x cups at 15% to reach 17%.'
publishedOn: 'March 6, 2026'
publishedAt: '2026-03-06'
readTime: '7 min'
author: 'Max'
difficulty: 'intermediate'
tags:
  - algebra
  - percents
  - mixtures
  - word problems
equation: '\sum A_{\text{in}}p_{\text{in}}=\sum A_{\text{out}}p_{\text{out}}'
featured: false
devOnly: true
---

<script>
	import LazyPostToolEmbed from '$lib/components/blog/lazy-post-tool-embed.svelte';
</script>

Mixture questions can look different on the surface, but the math underneath is the same every time: track how much pure ingredient is in the mix, and track total amount.

## Table of Contents

- [The Two Balances You Need](#the-two-balances-you-need)
- [Work the 10-Cups Example](#work-the-10-cups-example)
- [Two Inputs and Two Outputs (Find a Percent)](#two-inputs-and-two-outputs-find-a-percent)
- [General Formula for Quick Solves](#general-formula-for-quick-solves)
- [Common Mistakes to Avoid](#common-mistakes-to-avoid)
- [Try It Interactively](#try-it-interactively)

## The Two Balances You Need

Let each input have an amount and a percent concentration.

Start with the written-out balance equations:

$$
(A_1p_1)+(A_2p_2)=(A_3p_3)+(A_4p_4)
$$

$$
A_1+A_2=A_3+A_4
$$

Notation: $A$ means amount (cups), and $p$ means percent in decimal form.

To make this cleaner, we condense it with summation notation:

$$
\sum A_{\text{in}}p_{\text{in}}=\sum A_{\text{out}}p_{\text{out}}
$$

$$
\sum A_{\text{in}}=\sum A_{\text{out}}
$$

Where $\sum$ means "add all terms of this type."

- left side sums all inputs
- right side sums all outputs


Equivalent wording form:

$$
\sum_{\text{inputs}}(\text{amount}\cdot\text{percent})=\sum_{\text{outputs}}(\text{amount}\cdot\text{percent})
$$

$$
\sum_{\text{inputs}}(\text{amount})=\sum_{\text{outputs}}(\text{amount})
$$

In words, these balances mean:

- pure ingredient does not disappear
- total cups also have to match

For percent calculations, convert percentages to decimals first:

- $20\% = 0.20$
- $15\% = 0.15$
- $17\% = 0.17$

## Work the 10-Cups Example

Problem: We start with $10$ cups at $20\%$. We add $x$ cups at $15\%$. Final concentration is $17\%$. Find $x$.

Start with amount balance (just counting cups):

$$
\overbrace{10}^{\text{starting cups}}
\,+\,
\overbrace{x}^{\text{added cups}}
=
\overbrace{10+x}^{\text{final cups}}
$$

So the final mixture has $10+x$ total cups.

Intuition check before solving: the final percent must be between the two input percents, because we are blending only those two mixtures.

- lower input: $15\%$
- upper input: $20\%$
- target: $17\%$ (valid, since it is between $15\%$ and $20\%$)

Also, $17\%$ is closer to $15\%$ than to $20\%$, so we should expect more of the $15\%$ mixture than the $20\%$ mixture. That means we should expect $x>10$.

Set up solute balance:

$$
\overbrace{10(0.20)}^{10\text{ cups at }20\%}
\,+\,
\overbrace{x(0.15)}^{x\text{ cups at }15\%}
=
\overbrace{(10+x)(0.17)}^{(10+x)\text{ cups at }17\%}
$$

Expand both sides:

$$
2 + 0.15x = 1.7 + 0.17x
$$

Solve:

$$
0.3 = 0.02x
\quad\Rightarrow\quad
x=15
$$

So you need to add **15 cups** of the $15\%$ mixture. The final amount is $10+15=25$ cups.
This matches the intuition check above: $x=15>10$, so there is more of the lower-concentration mixture.

Quick check:

$$
\text{input solute}=10(0.20)+15(0.15)=2+2.25=4.25
$$

$$
\text{output solute}=25(0.17)=4.25
$$

Both match, so the answer is consistent.

## Two Inputs and Two Outputs (Find a Percent)

Now let the unknown be a concentration.

Suppose we mix two inputs:

- Input A: $8$ cups at $25\%$
- Input B: $12$ cups at $10\%$

Then we split into two outputs:

- Output 1: $5$ cups at $18\%$
- Output 2: $y$ cups at $q\%$ (find $q$)

Amount balance first:

$$
8+12=5+y
$$

$$
20=5+y
\quad\Rightarrow\quad
y=15
$$

Now solute balance:

$$
8(0.25)+12(0.10)=5(0.18)+15q
$$

$$
3.2=0.9+15q
\quad\Rightarrow\quad
2.3=15q
\quad\Rightarrow\quad
q=\frac{2.3}{15}\approx0.1533
$$

So Output 2 is about **$15.33\%$**.

Quick intuition check: $15.33\%$ is between $10\%$ and $25\%$, so it is a realistic blend percentage.

## General Formula for Quick Solves

If you start with amount $a$ at percent $p_1$, add $x$ at percent $p_2$, and target percent is $p_t$, then:

$$
a p_1 + x p_2 = (a+x)p_t
$$

Solving for $x$ gives:

$$
x = \frac{a(p_1-p_t)}{p_t-p_2}
$$

That formula is just a shortcut version of the same two-balance setup.

## Common Mistakes to Avoid

1. Mixing decimals and percentages in one equation. Keep everything as decimals.
2. Forgetting the final amount is $a+x$.
3. Setting target percent outside the blend range. If one mix is $15\%$ and the other is $20\%$, a target like $30\%$ is impossible by blending only those two.
4. Skipping a final check with both balance equations.

## Try It Interactively

Use the sliders below to test different values and see the two balances stay aligned.

<div class="not-prose my-8 rounded-2xl border border-border/70 bg-card/70 p-4">
	<LazyPostToolEmbed toolId="mixture-balance-lab" title="Mixture Balance Lab" />
</div>

If you want extra practice, keep $a=10$, $p_1=20\%$, and $p_2=15\%$, then try different target percentages between $15\%$ and $20\%$.
