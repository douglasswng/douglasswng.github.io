---
title: Why Continuous Behavioral Cloning Fails Exponentially (and How Robotics Gets Away With It)
date: 2026-04-16
topics: [robotics, imitation-learning]
---

Behavioral cloning has a well-known failure mode: small errors compound, and the policy drifts into states the expert never visited. The standard analysis bounds this drift as quadratic in the horizon — bad, but manageable. That bound assumes discrete actions. When actions are continuous, we show the picture is fundamentally worse: error grows exponentially in the horizon. Yet methods like ACT and diffusion policy routinely solve long-horizon manipulation tasks. What are they actually doing to survive?

## The Quadratic Bound

Behavioral cloning is supervised learning on expert demonstrations: collect $(s, a)$ pairs and train a policy to predict the action from the state. The trouble is that at test time the policy's predictions determine what states it sees next. A small mistake pushes it into unfamiliar states, causing further mistakes. This is covariate shift, and the drift is self-reinforcing.

Ross and Bagnell (2010) formalized how bad this compounding can get. Suppose we want to imitate an expert policy $\pi^*$ over a $T$-step task. We train a policy $\hat{\pi}$ by behavioral cloning, and it achieves a small per-step error rate: on states the expert actually visits, $\hat{\pi}$ disagrees with the expert with probability at most $\epsilon$. Small $\epsilon$ means $\hat{\pi}$ is good at imitating the expert. But is it good at the actual task? Write $J(\pi)$ for the expected total cost of running $\pi$ for $T$ steps on its own — no expert to correct it. How much can $J(\hat{\pi})$ exceed $J(\pi^*)$?

> [!abstract] Theorem (Ross & Bagnell, 2010)
> The excess cost of behavioral cloning over the expert grows quadratically in the horizon:
>
> $$J(\hat{\pi}) \leq J(\pi^*) + T^2 \epsilon$$
>
> where $\epsilon$ is the per-step imitation error under the expert's state distribution.

> [!note] Proof (informal)
> At each of the $T$ steps, the policy has roughly an $\epsilon$ chance of deviating from the expert. Once it deviates, it's in unfamiliar states, potentially paying cost $1$ for every remaining step. An error at step $t$ can cause damage for all $T - t$ remaining steps, so the total expected cost is approximately $\sum_{t=1}^{T} \epsilon(T - t) \sim T^2\epsilon$.

> [!note]- Proof
> **Setup.** We work with deterministic policies. Define:
>
> - $C_\pi(s) \in [0,1]$: immediate cost of taking action $\pi(s)$ in state $s$
> - $e_{\hat{\pi}}(s) = \mathbf{1}[\hat{\pi}(s) \neq \pi^*(s)]$: 0-1 error indicator
> - $d_{\pi^*}^t$: state distribution at step $t$ under $\pi^*$
> - $d_{\pi^*} = \frac{1}{T}\sum_{t=1}^T d_{\pi^*}^t$: averaged state distribution
> - $\epsilon_t = \mathbb{E}_{s \sim d_{\pi^*}^t}[e_{\hat{\pi}}(s)]$: per-step error at time $t$
> - $J(\pi) = \sum_{t=1}^T \mathbb{E}_{s \sim d_\pi^t}[C_\pi(s)]$: expected $T$-step cost
> - $p_t$: probability that $\hat{\pi}(s) = \pi^*(s)$ at every state visited by $\pi^*$ through steps $1, \ldots, t$
>
> **Claim.** Let $\hat{\pi}$ satisfy $\mathbb{E}_{s \sim d_{\pi^*}}[e_{\hat{\pi}}(s)] \leq \epsilon$. Then $J(\hat{\pi}) \leq J(\pi^*) + T^2\epsilon$.
>
> **Step 1: Decompose trajectories.** Define:
>
> - $\mu_t$: state distribution at step $t$ under $\pi^*$, conditioned on $\hat{\pi}$ agreeing at steps $1, \ldots, t{-}1$
> - $\nu_t$: state distribution at step $t$ under $\pi^*$, conditioned on $\hat{\pi}$ disagreeing at some step in $1, \ldots, t{-}1$
>
> By the law of total probability:
>
> $$d_{\pi^*}^t = p_{t-1}\,\mu_t + (1 - p_{t-1})\,\nu_t$$
>
> Two consequences follow by dropping non-negative terms. First, expanding $\epsilon_t = p_{t-1}\,\mathbb{E}_{\mu_t}[e_{\hat{\pi}}] + (1 - p_{t-1})\,\mathbb{E}_{\nu_t}[e_{\hat{\pi}}]$ and dropping the $\nu_t$ term:
>
> $$p_{t-1}\,\mathbb{E}_{s \sim \mu_t}[e_{\hat{\pi}}(s)] \leq \epsilon_t \tag{i}$$
>
> Second, expanding $J(\pi^*) = \sum_{t=1}^{T} [p_{t-1}\,\mathbb{E}_{\mu_t}[C_{\pi^*}] + (1-p_{t-1})\,\mathbb{E}_{\nu_t}[C_{\pi^*}]]$ and dropping the $\nu_t$ terms:
>
> $$\sum_{t=1}^T p_{t-1}\,\mathbb{E}_{s \sim \mu_t}[C_{\pi^*}(s)] \leq J(\pi^*) \tag{ii}$$
>
> **Step 2: Bound per-step cost.** Conditioned on agreement through step $t{-}1$, both policies took identical actions into identical dynamics, so $\mu_t$ is also the learner's state distribution at step $t$ given no prior mistakes. With probability $p_{t-1}$ the learner is on-track and faces states from $\mu_t$; otherwise it faces arbitrary states and pays at most $1$:
>
> $$\mathbb{E}_{s \sim d_{\hat{\pi}}^t}[C_{\hat{\pi}}(s)] \leq p_{t-1} \, \mathbb{E}_{s \sim \mu_t}[C_{\hat{\pi}}(s)] + (1 - p_{t-1}) \tag{iii}$$
>
> **Step 3: Bound on-track cost.** When the learner is on the expert's trajectory, at each state it either matches the expert and pays $C_{\pi^*}(s)$, or deviates and pays at most $1$. So $C_{\hat{\pi}}(s) \leq C_{\pi^*}(s) + e_{\hat{\pi}}(s)$. Taking expectations weighted by $p_{t-1}$ and applying (i):
>
> $$p_{t-1}\,\mathbb{E}_{s \sim \mu_t}[C_{\hat{\pi}}(s)] \leq p_{t-1}\,\mathbb{E}_{s \sim \mu_t}[C_{\pi^*}(s)] + \epsilon_t \tag{iv}$$
>
> **Step 4: Bound the drift probability.** Staying on-track through step $t$ requires being on-track through $t{-}1$ and not erring at $t$. By (i):
>
> $$p_t = p_{t-1}\!\left(1 - \mathbb{E}_{s \sim \mu_t}[e_{\hat{\pi}}(s)]\right) \geq p_{t-1} - \epsilon_t$$
>
> Unrolling from $p_0 = 1$ gives $p_{t-1} \geq 1 - \sum_{i=1}^{t-1}\epsilon_i$, so:
>
> $$1 - p_{t-1} \leq \sum_{i=1}^{t-1} \epsilon_i \tag{v}$$
>
> **Step 5: Assemble.** Substituting (iv) into (iii) gives $\mathbb{E}_{s \sim d_{\hat{\pi}}^t}[C_{\hat{\pi}}(s)] \leq p_{t-1}\,\mathbb{E}_{s \sim \mu_t}[C_{\pi^*}(s)] + \epsilon_t + (1 - p_{t-1})$. Bounding $(1 - p_{t-1}) \leq \sum_{i=1}^{t-1}\epsilon_i$ by (v) and collecting the $\epsilon$ terms:
>
> $$\mathbb{E}_{s \sim d_{\hat{\pi}}^t}[C_{\hat{\pi}}(s)] \leq p_{t-1} \, \mathbb{E}_{s \sim \mu_t}[C_{\pi^*}(s)] + \sum_{i=1}^{t} \epsilon_i$$
>
> Summing over $t = 1, \ldots, T$ and applying (ii) gives $J(\hat{\pi}) \leq J(\pi^*) + \sum_{t=1}^T \sum_{i=1}^{t} \epsilon_i$. Since $\sum_{i=1}^t \epsilon_i \leq \sum_{i=1}^T \epsilon_i$ for all $t$, the double sum is at most $T\sum_{i=1}^T \epsilon_i$. And since $\frac{1}{T}\sum_{t=1}^T \epsilon_t = \mathbb{E}_{s \sim d_{\pi^*}}[e_{\hat{\pi}}(s)] \leq \epsilon$ by assumption, this is at most $T^2\epsilon$:
>
> $$J(\hat{\pi}) \leq J(\pi^*) + T^2\epsilon \qquad \blacksquare$$

This bound is tight. Consider three states $\{s_0, s_1, s_2\}$. The expert takes action $a_1$ at $s_0$, transitions to $s_1$, and stays there forever at zero cost. A wrong action $a_2$ at $s_0$ sends the agent to a trap state $s_2$, where it has never seen the correct action and incurs cost $1$ every step. The expert visits $s_0$ only at step $1$, so it is a $1/T$ fraction of the average state distribution. A policy that errs at $s_0$ with probability $\epsilon T$ achieves average error $\frac{1}{T} \cdot \epsilon T = \epsilon$ under the expert distribution. But at deployment: with probability $\epsilon T$, it falls into $s_2$ and pays cost $1$ for all $T$ steps, giving expected cost $\epsilon T \cdot T = T^2\epsilon$.

So $T^2\epsilon$ is the true price of covariate shift with discrete actions. But the bound relies on a hidden assumption: that exact imitation is possible. With discrete actions, the policy either picks the expert's action or it doesn't. With continuous actions, it can't — no matter how small the $L_2$ error gets, some residual always remains, and as we'll see, that residual can compound exponentially.

## The Exponential Bound

Now suppose actions are continuous — the learner outputs a vector, not a discrete choice. The setup is the same: observe expert trajectories, train a policy, deploy it in closed loop. But error is no longer 0-1. The policy can't exactly match the expert's action; there's always some $L_2$ residual. The question is the same: how much can $J(\hat{\pi})$ exceed $J(\pi^*)$?

Simchowitz, Pfrommer, and Jadbabaie (2025) show that for a broad class of policies they call *simple*, error compounds exponentially in the horizon. For continuous states $\mathbf{x} \in \mathbb{R}^d$ and continuous actions $\mathbf{u} \in \mathbb{R}^m$, a simple policy is one satisfying three properties:

1. *Smooth.* The deterministic component $\boldsymbol{\mu}(\mathbf{x}) := \mathbb{E}_{\mathbf{u} \sim \hat{\pi}(\mathbf{x})}[\mathbf{u}]$ is $L$-Lipschitz and twice differentiable with second derivatives bounded by $M$.
2. *Simply-stochastic.* The noise shape doesn't depend on state — only the mean shifts with $\mathbf{x}$. Deterministic policies and Gaussians $\mathcal{N}(\boldsymbol{\mu}(\mathbf{x}), \boldsymbol{\Sigma})$ with fixed $\boldsymbol{\Sigma}$ both qualify.
3. *Markovian.* The policy maps the current state to an action with no dependence on history or timestep.

This is not a contrived class — it is standard behavioral cloning. Any neural network trained with $L_2$ loss to predict the expert's action from the current state qualifies, whether deterministic or with fixed-variance Gaussian noise.

> [!abstract] Theorem (informal; Simchowitz et al., 2025)
> Even when the environment is very stable, for any simple algorithm there exists a task where its error grows exponentially in the horizon:
>
> $$J(\hat{\pi}) - J(\pi^*) \gtrsim 1.05^T \cdot \epsilon$$
>
> where $\epsilon$ is the per-step imitation error under the expert's state distribution.

> [!abstract]- Theorem (Simchowitz et al., 2025)
> **Setup.** States $\mathbf{x} \in \mathbb{R}^d$, actions $\mathbf{u} \in \mathbb{R}^m$, deterministic dynamics $\mathbf{x}_{t+1} = f(\mathbf{x}_t, \mathbf{u}_t)$.
>
> The dynamics are *exponentially incrementally input-to-state stable* (E-IISS): there exist $C > 0$, $\rho \in (0,1)$ such that for any two state-input trajectories,
>
> $$\|\mathbf{x}_t - \mathbf{x}'_t\| \leq C\rho^t \|\mathbf{x}_1 - \mathbf{x}'_1\| + \sum_{k=1}^{t} C\rho^{t-k} \|\mathbf{u}_k - \mathbf{u}'_k\|.$$
>
> Initial state errors and past input perturbations both decay exponentially with age. The system actively contracts disturbances.
>
> The *expert-distribution error* measures $L_2$ imitation quality on expert states:
>
> $$\epsilon = \sum_{t=1}^{T} \mathbb{E}_{\mathbf{x}_t \sim d^{\,t}_{\pi^*}}\,\mathbb{E}_{\hat{\mathbf{u}}_t \sim \hat{\pi}(\mathbf{x}_t)}\!\left[\|\hat{\mathbf{u}}_t - \pi^*(\mathbf{x}_t)\|^2\right]^{1/2}$$
>
> Here $d^{\,t}_{\pi^*}$ is the state distribution at step $t$ under expert rollouts. $\epsilon$ is exactly what behavioral cloning minimizes, and exactly what says nothing about closed-loop behavior.
>
> **Theorem.** Fix $k \geq 1$, $s \geq 2$, and set $\epsilon_n := n^{-s/k}$. There exists a family of E-IISS instances with $d = k+2$, smooth dynamics, and $s$-smooth deterministic experts such that:
>
> (a) A proper, simple algorithm achieves training error $\mathbb{E}[\epsilon] = O(\epsilon_n)$.
>
> (b) For any simple algorithm, there is an instance in the family on which:
>
> $$\mathbb{E}\!\left[J(\hat{\pi}) - J(\pi^*)\right] \geq \Omega\left(\min\{1.05^T \epsilon_n, \; 1/(ML^2)\}\right)$$
>
> The pair $(k, s)$ parameterizes state dimension and expert smoothness, and $\epsilon_n = n^{-s/k}$ is the minimax rate for learning an $s$-smooth function on $\mathbb{R}^k$ from $n$ noiseless samples. So (a) says training is as statistically tractable as possible, and (b) says it still blows up exponentially at deployment. The $1/(ML^2)$ floor is a saturation term for very smooth learners.

> [!note] Proof (informal)
> Consider two 2D linear systems with coordinates $(x_1, x_2)$. In both, the expert drives $x_2$ to zero along the $x_2$-axis while holding $x_1 = 0$. The demonstrations from the two systems are identical, and every demo has $x_1 = 0$ throughout.
>
> The systems secretly differ off-axis: stabilizing a perturbation in $x_1$ requires a negative-sign feedback for system A and a positive-sign feedback for system B. Each expert applies the right sign, but since $x_1 = 0$ on every demo, the data never reveals it.
>
> The learner must therefore extrapolate, and smoothness forces it to commit to a single sign: stabilizing one of the two systems and destabilizing the other. At deployment, any slight drift off the $x_2$-axis on the bad system triggers a wrong-sign correction, which pushes $x_1$ further off, which triggers a larger wrong correction. The deviation grows geometrically through closed-loop feedback — that is the $1.05^T$.

The bound applies to any non-interactive algorithm — behavioral cloning, offline RL, inverse RL — provided the returned policy is simple: smooth, simply-stochastic, and Markovian. Read the other way, the assumptions are a blueprint: violate any one and the exponential blowup is no longer forced.

## Breaking the Bound

The bound rests on four assumptions — non-interactivity, smoothness, simple stochasticity, and the Markov property — and each is a potential axis of attack. The three methods below predate the theory; they were discovered empirically, and the bound arrived later to explain why they work. Read forward, though, the framing is generative: the fourth axis, still unbroken, is where new algorithms might live.

**DAgger** — short for Dataset Aggregation — breaks the non-interactive assumption. Instead of training only on expert demonstrations, DAgger rolls out the learned policy, visits states the learner actually encounters, and queries the expert for the correct action at those states. The loss is now evaluated under $d_{\hat{\pi}}$ rather than $d_{\pi^*}$, which eliminates the covariate shift that drives both the quadratic and exponential bounds. The catch is that it requires expert access during training, which in robotics means a human teleoperating on demand at every iteration.

**Action chunking** breaks the Markov property by predicting a chunk of $k$ actions from the current state and executing them open-loop, so mid-chunk actions depend on the state at the start of the chunk, not the current state. The exponential blowup in the lower bound comes from a destabilizing feedback loop: the policy observes its own drift, applies the wrong correction, drifts further, repeat. Within a chunk there is no feedback, and under E-IISS open-loop perturbations decay exponentially. The same stability assumption that powers the lower bound is what makes chunking work.

**Diffusion policies** break simple stochasticity. A simply-stochastic policy can shift the mean of its output distribution with state but not reshape it. The lower bound exploits exactly this: two systems require opposite feedback signs, and a simply-stochastic policy must commit to one sign everywhere, destabilizing the other. A diffusion policy's output distribution changes shape with the input state, so it can maintain both signs as separate modes and sample contextually in the ambiguous region.

## References

- Ross, S. & Bagnell, J. A. (2010). "Efficient Reductions for Imitation Learning." *Proceedings of the 13th International Conference on Artificial Intelligence and Statistics (AISTATS)*. [PMLR:v9/ross10a](https://proceedings.mlr.press/v9/ross10a/ross10a.pdf) ([supplementary](https://proceedings.mlr.press/v9/ross10a/ross10aSupple.pdf))
- Simchowitz, M., Pfrommer, T., & Jadbabaie, A. (2025). "The Pitfalls of Imitation Learning when Actions are Continuous." [arXiv:2503.09722](https://arxiv.org/abs/2503.09722)