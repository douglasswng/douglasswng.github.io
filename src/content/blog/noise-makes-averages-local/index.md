---
title: Noise Makes Averages Local
date: 2026-11-01
topics:
  - diffusion
  - imitation-learning
---

When many actions succeed at a state, regression outputs their average, which can itself fail. Pan et al. (2026) find that a minimal two-step policy trained with noise matches flow matching on behavior cloning, and that it needs both the noise and the second step, but leave the mechanism open. Here is one: a step trained on noisy inputs averages only the successful actions near its input, so its output stays among them when the noise is large enough to reach them and small enough that they look flat within it.

## Setup

A policy maps a state $s$ to an action $a_\theta(s)$. For each state, the actions that succeed form a set $\mathcal{M}(s)$. By the manifold hypothesis, this set is typically a thin band around a curved, lower-dimensional manifold. The band has width because tiny differences do not matter: a robot's motors have limited precision. Training never sees $\mathcal{M}(s)$ directly, only demonstrations. For simplicity, the expert at each visited state $s$ samples $a \sim \mathcal{U}(\mathcal{M}(s))$.

<p align="center">
<img src="/noise-makes-averages-local/bc_setup.svg" alt="The policy maps a state to an action: an action in the curved band of successful actions succeeds, one in the empty middle fails" width="700">
</p>

## Regression Averages Globally

Regression fits $a_\theta$ by minimising, averaged over visited states, $\mathbb{E}_{a\sim\mathcal{U}(\mathcal{M}(s))}\|a - a_\theta(s)\|^2$. A state often has many successful actions, but the policy outputs only one, so it must compromise between them. The compromise squared error picks is a standard result:

> [!abstract] Theorem
> Let $y$ be a random vector in $\mathbb{R}^d$ with finite second moment. Among all constants $c$, the unique minimiser of $\mathbb{E}\,\|y - c\|^2$ is $\mathbb{E}[y]$.

> [!note]- Proof
> Let $\mu = \mathbb{E}[y]$. Then
> $$
> \begin{aligned}
> \mathbb{E}\|y - c\|^2 &= \mathbb{E}\|(y - \mu) + (\mu - c)\|^2 \\
> &= \mathbb{E}\|y - \mu\|^2 + 2(\mu - c)^\top \mathbb{E}[y - \mu] + \|\mu - c\|^2 \\
> &= \mathbb{E}\|y - \mu\|^2 + \|\mu - c\|^2,
> \end{aligned}
> $$
> since $\mathbb{E}[y - \mu] = 0$. The first term does not depend on $c$ and the second is zero only at $c = \mu$.

At a fixed state $s$, the prediction $a_\theta(s)$ is a constant $c$ and the expert action $a \sim \mathcal{U}(\mathcal{M}(s))$ plays $y$, so regression predicts $\mathbb{E}[a]$, the centroid of $\mathcal{M}(s)$. Nothing forces the centroid to lie in $\mathcal{M}(s)$.

<p align="center">
<img src="/noise-makes-averages-local/regression_sgd_arc.svg" alt="Regression trained by SGD settles at the mean of each band: off the semicircle, on the short arc" width="528">
</p>

*Each SGD step pulls the prediction towards a random expert action, so it settles at their mean: in the empty middle of a semicircle (top), but on the band for a short arc (bottom).*

## Iterative Policies

Pan et al. attribute the success of diffusion and flow matching to two ingredients acting together: iteration and training noise. Both methods have much else besides. To keep only these two ingredients, they propose a minimal iterative policy (MIP). We use a variant with uniform rather than Gaussian noise and call it the *silly minimal iterative policy* (SMIP).

**Training.** SMIP has two heads, $a^{(1)}_\theta(s)$ and $a^{(2)}_\theta(s, \tilde a)$. For each demonstration $(s, a)$, draw $u$ uniformly from the unit ball and set $\tilde a = a + r u$ for a fixed radius $r$. Both heads regress onto the expert action:

$$\mathcal{L}(\theta) = \|a - a^{(1)}_\theta(s)\|^2 + \|a - a^{(2)}_\theta(s, \tilde a)\|^2.$$

**Inference.** The heads run in sequence, with no noise:

$$\hat a_1 = a^{(1)}_\theta(s), \qquad \hat a_2 = a^{(2)}_\theta(s, \hat a_1).$$

## Iteration Averages Locally

The first head sees only $s$, so by the theorem its prediction $\hat a_1$ is the centroid of $\mathcal{M}(s)$, the same compromise regression makes. Any gain must come from the second head, the only one trained on noisy inputs.

Head 2 sees $s$ and $\hat a_1$, so by the theorem it predicts $\mathbb{E}[a \mid s, \hat a_1]$. In training, every input to head 2 was an expert action pushed at most $r$ away. Since the expert and the noise are both uniform, every successful action within $r$ of $\hat a_1$ is equally likely to have produced $\hat a_1$, so $\mathbb{E}[a \mid s, \hat a_1]$ is their centroid.

<p align="center">
<img src="/noise-makes-averages-local/smip_inference_arc.svg" alt="SMIP inference: head 1 lands at the mean of the semicircle, off the band; head 2 averages the band within r of it and lands back on the band" width="480">
</p>

If $\hat a_1$ is close to $\mathcal{M}(s)$, a ball that just reaches $\mathcal{M}(s)$ cuts out a small, nearly flat patch around the nearest point. The centroid of such a patch lies in the patch, so head 2 lands close to $\mathcal{M}(s)$.

That needs $r$ at least the distance from $\hat a_1$ to $\mathcal{M}(s)$, or head 2 never saw such an input in training. It also needs $r$ small enough that $\mathcal{M}(s)$ looks flat within it, or the ball cuts out a curved stretch whose centroid is off $\mathcal{M}(s)$, head 1's mistake again.

<p align="center">
<img src="/noise-makes-averages-local/smip_r_window.svg" alt="SMIP with r too small: the ball around head 1's output contains no expert action, so head 2's target is undefined; with r too large: the ball covers a long curved stretch of the band, whose centroid lands off it" width="480">
</p>

## Experiment

The previous section predicts a window for $r$. Does such a window always exist? We train SMIP on arcs of growing angle and sweep $r$.

<p align="center">
<img src="/noise-makes-averages-local/smip_r_sweep.svg" alt="Trained SMIP on arcs of 60, 180 and 300 degrees as r grows: the short arc stays on the band, the semicircle lands on it once the ball reaches the band and leaves once the ball covers the curve, the 300 degree arc never lands" width="720">
</p>

On the 60° arc, every $r$ works: the whole arc is nearly flat, so whatever part the ball cuts out, its centroid stays on the band. On the semicircle, $\hat a_2$ lands on the band only for $r$ between about 0.2 and 0.7. On the 300° arc, no $r$ works: by the time the ball reaches the band, it covers most of the arc.

To see how well the theory predicts practice, we sweep both the arc angle and $r$. The interesting region is where the theory is silent: when $r$ is too small, the ball around $\hat a_1$ never reaches the band, so head 2 sees an input it never trained on, and nothing says what it outputs.

<p align="center">
<img src="/noise-makes-averages-local/smip_sweep.svg" alt="Heatmaps over arc width and noise radius: head 2 lands on the band between the distance from head 1's output to the band and r of about 0.7; the window narrows as the arc widens and vanishes near the full circle" width="720">
</p>

The trained SMIP matches the theory wherever the theory has an answer. Below about 90°, nearly every $r$ works; beyond that, the window narrows and closes around 270°. The dashed line marks where the ball around $\hat a_1$ first reaches the band. Below it, head 2 extrapolates beyond its training inputs: almost nothing lands, and the miss grows as $r$ shrinks.

## Conclusion

Neither ingredient works alone. Without iteration, head 1 outputs the centroid, as regression does. Without noise, head 2 only ever sees inputs on $\mathcal{M}(s)$, so $\hat a_1$, off it, is an input it never trained on.

A single radius has two jobs: reach $\mathcal{M}(s)$ from $\hat a_1$, and stay small enough that $\mathcal{M}(s)$ looks flat within it. On wide arcs these conflict, and no $r$ does both. Diffusion and flow matching split the jobs across steps: early steps use large noise to reach the band, late steps use small noise to stay local. So they handle curves where SMIP fails.

## References

- Pan, C., Anantharaman, G., Huang, N.-C., Jin, C., Pfrommer, D., Yuan, C., Permenter, F., Qu, G., Boffi, N., Shi, G., & Simchowitz, M. (2026). "Much Ado About Noising: Dispelling the Myths of Generative Robotic Control." *International Conference on Learning Representations (ICLR)*. [arXiv:2512.01809](https://arxiv.org/abs/2512.01809)
