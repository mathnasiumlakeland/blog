---
title: "Are You Interested Yet?"
subtitle: "The basics of interest and Euler's number"
excerpt: "A walkthrough of simple interest, compound interest, continuous compounding, and Euler's number."
publishedOn: "October 15, 2022"
publishedAt: "2022-10-15"
readTime: "14 min"
author: "Max"
tags:
  - interest
  - algebra
  - exponential-growth
equation: "A = P\\left(1 + \\frac{r}{n}\\right)^{nt}"
featured: false
---

<script>
	import SimpleInterestGrowthVisual from '$lib/components/math/simple-interest-growth-visual.svelte';
	import CompoundInterestGrowthVisual from '$lib/components/math/compound-interest-growth-visual.svelte';
	import ContinuousCompoundingGrowthVisual from '$lib/components/math/continuous-compounding-growth-visual.svelte';
	import CompoundInterestConvergenceToEVisual from '$lib/components/math/compound-interest-convergence-to-e-visual.svelte';
</script>

Let's talk about interest and investment growth.

# Introduction
Here are some relevant variables:

| Variable | Meaning |
| --- | --- |
| $P$ | initial principal |
| $r$ | interest rate |
| $t$ | time in years |
| $n$ | number of periods |
| $x$ | recurring payment |
| $A_n$ | amount after n periods |
| $A$ | total amount |

---

# Simple Interest
We begin with simple interest. After a period of time has elapsed, interest is only applied to the initial principal invested. In this case we consider each period to be one year, so we have a total of $t$ periods.

When the principal is first invested, the total amount, $A_0$, is just equal to that principal. After one year, we see that the running total is now equal to the principal, $P$, plus interest on the principal, $rP$.

$$
\begin{aligned}
A_0 &= P \\
A_1 &= P + rP = P(1 + r) \\
A_2 &= P + rP + rP = P(1 + r + r) = P(1 + 2r) \\
&\;\;\vdots \\
A_t &= P + rP + \cdots + rP = P(1 + r + \cdots + r) = P(1 + tr)
\end{aligned}
$$

Continuing this process $t$ times, we see that the total amount after $t$ years is

$$
A = P(1 + rt). \tag{1}
$$

<div class="not-prose my-8 rounded-2xl border border-border/70 bg-card/70 p-4">
	<SimpleInterestGrowthVisual />
</div>

## Example
Suppose $\$1200$ is invested at a simple annual interest rate of $5\%$ for $3$ years. Find the total amount at the end of the investment period.

<details class="rounded-xl border border-border/70 bg-background/70 p-4">
<summary class="cursor-pointer text-sm font-semibold text-foreground">Reveal solution</summary>

Use equation $(1)$ with $P=\$1200$, $r=0.05$, $t=3$ years:

$$
\begin{aligned}
A &= P(1+rt) \\
&= 1200(1+0.05\cdot 3) \\
&= 1200(1.15) \\
&= \boxed{\$1380}
\end{aligned}
$$

</details>

---

# Compound Interest

## Annual Compounding
What would happen if interest also accrued interest? This is the basic motivation behind compound interest. We will consider what happens when there is interest on the original principal as well as on the interest.

Let's first look at a simple case in which interest is compounded once per year. We see that after one year has passed, interest accrues on the starting amount, $A_0$, which is simply the principal, $P$, invested. This means that our new amount, $A_1$, is given by $A_0(1+r)$ where $A_0 = P$. After a second year passes, interest accrues on the amount from the first year, $A_1$, so our new amount, $A_2$, is $A_1(1+r)$. Through this process we are compounding the interest on the initial principal and previous interest.

$$
\begin{aligned}
A_0 &= P \\
A_1 &= A_0(1 + r) = P(1+r) \\
A_2 &= A_1(1 + r) = P(1+r)(1+r) = P(1+r)^2 \\
A_3 &= A_2(1 + r) = P(1+r)^2(1+r) = P(1+r)^3 \\
&\;\;\vdots \\
A_t &= P(1+r)^{t-1}(1+r) = P(1+r)^t
\end{aligned}
$$

If we continue compounding interest on the previous year's amount, we see that the total amount after $t$ years is

$$
A = P(1 + r)^t. \tag{2}
$$

## Multiple Compounding Periods
So far, we have assumed that interest is compounded once per year. Now we will see what happens if we compound interest multiple times a year. 

If $n$ is the number of periods in one year, and we have a total interest rate of $r$, then the interest rate per period is $\frac{r}{n}$. If we decide to compound monthly, then $n = 12$ and we apply an interest of $\frac{r}{12}$ each month.

This tells us that our total amount will grow to

$$
A_1 = P\left(1 + \frac{r}{n}\right)
$$

after one period.

But now we need to figure out how many total times we will compound the interest. If $n$ is the number of periods in one year, and $t$ is the number of years, then the total number of periods is $nt$.




$$
n \cdot t = \frac{\text{number of periods}}{\text{year}} \cdot \text{years} = \text{number of periods}.
$$

Putting everything together, we get the formula

$$
A = P\left(1 + \frac{r}{n}\right)^{nt}, \tag{3}
$$

which is how the compound interest formula is usually written. Notice that if there is only one compounding period per year (i.e. when we have an annual compound with $n = 1$) then we recover equation $(2)$ above.

<div class="not-prose my-8 rounded-2xl border border-border/70 bg-card/70 p-4">
	<CompoundInterestGrowthVisual />
</div>


## Example
Suppose $\$1500$ is invested at an annual rate of $6\%$, compounded weekly, for $2$ years. Find 1)how many total compounding periods there are, 2) what percentage of interest is applied each week, and 3) the total amount at the end of the investment period.

<details class="rounded-xl border border-border/70 bg-background/70 p-4">
<summary class="cursor-pointer text-sm font-semibold text-foreground">Reveal solution</summary>

Use equation $(3)$ with $P=\$1500$, $r=0.06$, $n=52$ (52 weeks per year), $t=2$ years.

1) The total number of compounding periods is $nt = 52 \cdot 2 = 104$ periods.

2) The percentage of interest applied each week is $\frac{r}{n} = \frac{0.06}{52} \approx 0.0012$ or $0.12\%$.

3) The total amount at the end of the investment period is

$$
\begin{aligned}
A &= P\left(1+\frac{r}{n}\right)^{nt} \\
&= 1500\left(1+\frac{0.06}{52}\right)^{52\cdot2} \\
&\approx\boxed{\$1691.13}
\end{aligned}
$$

</details>

---

# Continuously Compounded Interest

## Euler's Number
Now that we have a formula that accounts for the number of times interest is compounded over any given period of time, we might wonder what happens when we look at the extremes. For this demonstration, we will consider a specific case where $P = r = t = 1$ given by

$$
A_n = \left(1 + \frac{1}{n}\right)^{n}. \tag{4}
$$

The first extreme we consider is when we have the smallest number of compounding events in a year. This simply translates to an annual compounding interest with $n = 1$. We find that after a year with one compounding event, the total amount is

$$
A_1 = \left(1 + \frac{1}{1}\right)^{1} = (1+1) = 2.
$$

What happens if we compound twice per year with $n = 2$?

$$
A_2 = \left(1 + \frac{1}{2}\right)^{2} = \left(\frac{3}{2}\right)^2 = \frac{9}{4} = 2.25
$$

What about if we compound the interest every month with $n = 12$?

$$
A_{12} = \left(1 + \frac{1}{12}\right)^{12} \approx 2.6130
$$

What about every week with $n = 52$?

$$
A_{52} = \left(1 + \frac{1}{52}\right)^{52} \approx 2.6926
$$

What about every day with $n = 365$?

$$
A_{365} = \left(1 + \frac{1}{365}\right)^{365} \approx 2.7146
$$

What about every hour with $n = 8760$?

$$
A_{8760} = \left(1 + \frac{1}{8760}\right)^{8760} \approx 2.7181
$$

We find that increasing the number of times we compound the interest in a single year leads to a larger amount overall. If we had our money in a bank, we might want to figure out how to use this to our advantage. This leads us to a natural question: what is the largest total amount of money we can accrue in a single year under the given conditions? But before we proceed, we might want to ponder over whether this question even has an answer. We have already seen that as $n$ increases, so to does the value $A_n$. Might this mean that no local maxima exist? For if we were to add one more compound in a single year, then $A_n \lt A_{n+1}$. Will the value of $A_n$ keep growing forever?

Another problem is that increasing the number of compounds per year requires us to continually shorten the span of time between said compounds. Compounding twice per year led us to considering periods of 6 months, while compounding 8760 times per year shortened that span of time to 1 hour. We can further this by compounding once every minute, once every second, millisecond, nanosecond, and beyond to infinitesimal spans of time.

The problem of finding the largest amount may seem intractable at first, but surprisingly, we are able to find an exact answer. The solution relies on the fact that the function $A_n$ eventually converges. Essentially, this means that when $n$ is very large, the value of $A_n$ should settle around some number. We can test this by checking large values: $A_{1000} \approx 2.7169$, $A_{10,000} \approx 2.7181$, $A_{100,000} \approx 2.71827$, $A_{1,000,000} \approx 2.71828$. Here we see that $A_n$ does seem to converge around the number $2.71$.

<div class="not-prose my-8 rounded-2xl border border-border/70 bg-card/70 p-4">
	<CompoundInterestConvergenceToEVisual />
</div>


In fact, $A_n$ converges to a very special mathematical constant called Euler's number, denoted $e$. We may define $e$ by

$$
e \equiv \lim_{n \to \infty}\left(1 + \frac{1}{n}\right)^{n}, \tag{5}
$$

where $e \approx 2.71828$. This notation simply means that as we increase the value of $n$ to the limit towards infinity, that the value $A_n = e$.

## The Formula!
This is our answer. If we compound the interest an infinite number of times in a single year with starting principal of $\$1$ and rate of $100\%$, then the total amount of money in our bank account would be $\$e \approx \$2.72$. This sets the upper limit of how much money is possible to be earned given the above conditions.


So the formula for continuously compounding interest is

$$
A = Pe^{rt}. \tag{7}
$$

<div class="not-prose my-8 rounded-2xl border border-border/70 bg-card/70 p-4">
	<ContinuousCompoundingGrowthVisual />
</div>

## Example
Suppose $\$2000$ is invested at a continuous annual rate of $4.5\%$ for $6$ years. Find the total amount at the end of the investment period.

<details class="rounded-xl border border-border/70 bg-background/70 p-4">
<summary class="cursor-pointer text-sm font-semibold text-foreground">Reveal solution</summary>

Use equation $(7)$ with $P=\$2000$, $r=0.045$, $t=6$ years, and $e \approx 2.71$:

$$
\begin{aligned}
A &= Pe^{rt} \\
&= 2000e^{0.045\cdot 6} \\
&= 2000e^{0.27} \\
&\approx\boxed{\$2619.93}
\end{aligned}
$$

</details>


---

# Interest Cheat Sheet
Here are the main equations from this page in one place.

**Simple interest:**
$$
A = P(1+rt)
$$

**Compound interest (annual):**
$$
A = P(1+r)^t
$$

**Compound interest ($n$ times per year):**
$$
A = P\left(1+\frac{r}{n}\right)^{nt}
$$

**Sequence used for convergence:**
$$
A_n = \left(1+\frac{1}{n}\right)^n
$$

**Definition of Euler's number:**
$$
e = \lim_{n\to\infty}\left(1+\frac{1}{n}\right)^n \approx 2.71
$$

**Continuous compounding:**
$$
A = Pe^{rt}
$$
