---
title: Why Tokens Are Enough
date: 2026-03-16
topics:
  - tokenization
  - information-theory
created: 2026-03-14T09:15
updated: 2026-03-16T19:27
---
Modern language models don't train on text — a tokenizer chops raw text into chunks, and the model only ever sees those chunks. This indirection raises two natural questions. First: what does tokenization lose? A language model is a distribution over strings, but we're learning a distribution over token sequences — does this restrict what we can express? Second: what does tokenization add? Even if nothing is lost, the token representation might introduce redundancy that the model must waste capacity on. We'll show that with a lossless tokenizer, the answer to both questions is: nothing.

## What is a lossless tokenizer?

A tokenizer chops strings into chunks called tokens. A lossless tokenizer is one where you can perfectly reconstruct the original string from those chunks — nothing is lost in translation.

To make this precise, we need a few objects. An **alphabet** $\Sigma$ is a finite set of characters. The set $\Sigma^*$ contains all finite strings over $\Sigma$, including the empty string. A **vocabulary** $V$ is a finite set of tokens, where each token is typically a short string from $\Sigma^*$. The set $V^*$ contains all finite token sequences over $V$.

A **tokenizer** $\tau: \Sigma^* \to V^*$ maps a string to a token sequence. A **detokenizer** $\kappa: V^* \to \Sigma^*$ maps a token sequence back to a string, typically by concatenating the tokens together.

We say $\tau$ is **lossless** if there exists a detokenizer $\kappa$ such that every string satisfies the **round-trip property** $\kappa(\tau(s)) = s$.

> **Example.** Let $\Sigma = \{\text{h}, \text{e}, \text{l}, \text{o}\}$ and $V = \{\text{h}, \text{e}, \text{l}, \text{o}, \text{el}, \text{lo}\}$. The tokenizer maps $\tau(\text{hello}) = (\text{h}, \text{el}, \text{lo})$, and the detokenizer concatenates: $\kappa((\text{h}, \text{el}, \text{lo})) = \text{hello}$. The round-trip gives $\kappa(\tau(\text{hello})) = \text{hello}$.

Losslessness forces $\tau$ to be injective — distinct strings must map to distinct token sequences. If two strings $s \neq s'$ mapped to the same token sequence $\tau(s) = \tau(s') = t$, then the round-trip property would require $\kappa(t) = s$ and $\kappa(t) = s'$, contradicting $s \neq s'$.

> **Note.** We do *not* require the reverse direction: multiple token sequences can detokenize to the same string. For instance, both $(\text{h}, \text{el}, \text{lo})$ and $(\text{h}, \text{e}, \text{l}, \text{l}, \text{o})$ concatenate to "hello". The tokenizer picks one; the others are unused sequences in $V^*$. Losslessness only requires the forward-then-back direction to work.

## Modeling strings via tokens

A **language model** is a probability distribution over $\Sigma^*$:

$$
\mathbb{P}: \Sigma^* \to [0,1]
$$

When we train on token sequences instead, we're learning a different object — a distribution over $V^*$:

$$
\mathbb{Q}: V^* \to [0,1]
$$

How does a distribution over token sequences give us a distribution over strings? The natural answer: the probability of a string is the total probability of all the ways to produce it — sum over every token sequence that detokenizes to that string. This defines the **induced language model** $\mathbb{P}$ as the pushforward of $\mathbb{Q}$ through $\kappa$:

$$
\mathbb{P}(s) = \sum_{t \in \kappa^{-1}(s)}\mathbb{Q}(t)
$$

where $\kappa^{-1}(s) = \{t \in V^* : \kappa(t) = s\}$ is the preimage of $s$ — the set of all token sequences that detokenize to $s$.

> **Example.** Two token sequences detokenize to $\text{hello}$: $t = (\text{h}, \text{el}, \text{lo})$ and $t' = (\text{h}, \text{e}, \text{l}, \text{l}, \text{o})$. The induced probability is $\mathbb{P}(\text{hello}) = \mathbb{Q}(t) + \mathbb{Q}(t')$.

To verify that $\mathbb{P}$ sums to one, note that the preimage sets $\kappa^{-1}(s)$ partition $V^*$ — since $\kappa$ is a function, every token sequence detokenizes to exactly one string, so each $t \in V^*$ belongs to exactly one $\kappa^{-1}(s)$ — giving us:

$$
\sum_{s \in \Sigma^*} \mathbb{P}(s) = \sum_{s \in \Sigma^*} \sum_{t \in \kappa^{-1}(s)}\mathbb{Q}(t) = \sum_{t \in V^*} \mathbb{Q}(t) = 1
$$

## What does tokenization lose?

The question is whether this inducing relationship is *surjective*: can every language model $\mathbb{P}$ be induced by some $\mathbb{Q}$? If not, then modeling token sequences is strictly less expressive than modeling strings, and tokenization loses something.

For lossless tokenizers, the answer is yes. A lossless $\tau$ is injective, so every string maps to exactly one token sequence. This means we can transfer probability directly by setting $\mathbb{Q}(\tau(s)) = \mathbb{P}(s)$ and zero elsewhere. We call this the **canonical inducing distribution**.

**Claim.** When $\tau$ is lossless, any desired $\mathbb{P}$ can be exactly induced by some $\mathbb{Q}$.

*Proof.* Define $\mathbb{Q}(t) = \mathbb{P}(\kappa(t))$ for $t \in \tau(\Sigma^*)$ and $\mathbb{Q}(t) = 0$ otherwise. This sums to one because $\tau$ is a bijection onto its image:

$$
\sum_{t \in V^*} \mathbb{Q}(t) = \sum_{t \in \tau(\Sigma^*)} \mathbb{P}(\kappa(t)) = \sum_{s \in \Sigma^*} \mathbb{P}(s) = 1
$$

To check it induces $\mathbb{P}$: since $\mathbb{Q}$ is zero outside $\tau(\Sigma^*)$, the only token sequence in $\kappa^{-1}(s)$ with positive mass is $\tau(s)$. So:

$$
\sum_{t \in \kappa^{-1}(s)}\mathbb{Q}(t) = \mathbb{Q}(\tau(s)) = \mathbb{P}(\kappa(\tau(s))) = \mathbb{P}(s)
$$

where the last step is losslessness. $\square$

> **Note.** The canonical $\mathbb{Q}$ is not the only distribution that induces $\mathbb{P}$. For instance, if $\mathbb{P}(\text{hello}) = 1$, both $t = (\text{h}, \text{el}, \text{lo})$ and $t' = (\text{h}, \text{e}, \text{l}, \text{l}, \text{o})$ detokenize to $\text{hello}$, so any $\mathbb{Q}$ satisfying $\mathbb{Q}(t) + \mathbb{Q}(t') = 1$ induces $\mathbb{P}$. The canonical construction puts all mass on whichever sequence is $\tau(\text{hello})$.

This construction fails when $\tau$ is lossy. If $\tau(s) = \tau(s') = t$ for distinct strings $s \neq s'$, the construction assigns $\mathbb{Q}(t) = \mathbb{P}(\kappa(t))$, which recovers the probability of only one of the merged strings. The probability mass of the other is lost entirely, so $\sum_{t \in V^*} \mathbb{Q}(t) < 1$ — the constructed $\mathbb{Q}$ isn't even a valid distribution.

> **Example.** Suppose both "l" and "ł" map to the same token $l$, so $\tau(\text{hello}) = \tau(\text{hełło}) = (\text{h}, \text{el}, \text{lo})$. Let $\mathbb{P}(\text{hello}) = \mathbb{P}(\text{hełło}) = 0.5$. The construction sets $\mathbb{Q}((\text{h}, \text{el}, \text{lo})) = \mathbb{P}(\kappa((\text{h}, \text{el}, \text{lo}))) = \mathbb{P}(\text{hello}) = 0.5$ and $\mathbb{Q} = 0$ everywhere else. The total mass is $0.5$, not $1$ — the probability of $\text{hełło}$ has nowhere to go.

## What does tokenization add?

We showed that a lossless tokenizer doesn't restrict what language models can express. But expressiveness isn't the only concern — tokenization could introduce redundancy. Multiple token sequences can detokenize to the same string, so a model over $V^*$ must somehow distribute probability across these equivalent sequences. Does this force the model to waste capacity on a spurious choice?

We can make this precise using entropy. Recall that the entropy of a discrete random variable $X$ with distribution $p$ over finite sample space $\mathcal{X}$ is:

$$
H(X) = -\sum_{x \in \mathcal{X}} p(x)\log p(x)
$$

Entropy measures average uncertainty — it is zero when all mass is on a single outcome and maximized under a uniform distribution. If tokenization adds redundancy, a model over token sequences should require strictly more entropy than the underlying string distribution.

For lossless tokenizers, it needn't. The canonical $\mathbb{Q}$ from the previous section places all mass on $\tau(s)$ for each string $s$, so exactly one token sequence per string has positive probability — achieving $H(\mathbb{Q}) = H(\mathbb{P})$. Tokenization adds no redundancy. We can make this precise:

**Claim.** Any distribution $\mathbb{Q}$ on $V^*$ that induces $\mathbb{P}$ satisfies $H(\mathbb{Q}) \geq H(\mathbb{P})$, with equality if and only if for every string $s$, at most one token sequence in $\kappa^{-1}(s)$ has positive probability under $\mathbb{Q}$.

*Proof.* Let $T \sim \mathbb{Q}$ and $S = \kappa(T)$. By the inducing property, $S \sim \mathbb{P}$. Since $S$ is a deterministic function of $T$, the chain rule of entropy gives:

$$
H(T) = H(S) + H(T \mid S) \geq H(S) = H(\mathbb{P})
$$

The gap $H(T \mid S)$ is the residual uncertainty about *which* token sequence was used, given the string it represents. This is zero if and only if, conditioned on each string $s$, the distribution $\mathbb{Q}$ concentrates on a single token sequence in $\kappa^{-1}(s)$ — i.e., for every $s$, at most one $t \in \kappa^{-1}(s)$ has $\mathbb{Q}(t) > 0$. $\square$

> **Example.** Consider $\mathbb{P}(\text{hello}) = 1$. The canonical distribution puts all mass on $\tau(\text{hello})$, giving $H(T) = 0 = H(S)$. A distribution that splits mass evenly between $(\text{h}, \text{el}, \text{lo})$ and $(\text{h}, \text{e}, \text{l}, \text{l}, \text{o})$ would give $H(T) = \log 2 > 0 = H(S)$ — the extra bit encodes a meaningless choice of tokenization.

## Does it matter?

Theory tells us that the model should assign all the weight to the canonical tokenization. Chatzi et al. (2025) make the case for why: they prove that canonical sampling — restricting generation to token sequences that the tokenizer would actually produce — yields a token-level distribution provably closer to the training distribution in KL-divergence than standard sampling does. The intuition is clean: since the model only ever saw canonical sequences during training, non-canonical sequences are out-of-distribution, and probability placed on them is probability placed where the model has no training signal.

How much probability leaks in practice? Chirkova et al. (2023) estimated the gap between $\mathbb{Q}(\tau(s))$ and the true pushforward $\sum_{t:\kappa(t)=s}\mathbb{Q}(t)$ using importance sampling over tokenizations of GPT-2 and BLOOM. For well-represented text (Wikipedia, news), the relative gap in bits-per-character was under 0.5%. It grew for out-of-distribution text — ~1.6% on Twitter, ~2% on transcribed speech — driven by rare words that split into long token sequences and leak probability onto non-default segmentations.

So is this redundancy of assigning mass to non-canonical tokenizations necessarily bad? BPE-Dropout (Provilkov et al., 2020) randomly drops merge operations during training, exposing the model to varied tokenizations of the same string. This acts as a regularizer: the model learns more robust subword representations, improving translation quality by up to 2.3 BLEU over standard BPE. So while the canonical $\mathbb{Q}$ is information-theoretically optimal, deliberately introducing some tokenization noise can help generalization — a case where a bit of redundancy pays for itself.

## References
- Chatzi, I., Corvelo Benz, N., Tsirtsis, S., & Gomez-Rodriguez, M. (2025). *Tokenization Multiplicity Leads to Arbitrary Price Variation in LLM-as-a-service.* [arXiv:2506.06446](https://arxiv.org/abs/2506.06446)
- Chirkova, N., Kruszewski, G., Rozen, J., & Dymetman, M. (2023). *Should you marginalize over possible tokenizations?* Proceedings of the 61st Annual Meeting of the Association for Computational Linguistics (Volume 2: Short Papers). [arXiv:2306.17757](https://arxiv.org/abs/2306.17757)
- Provilkov, I., Emelianenko, D., & Voita, E. (2020). *BPE-Dropout: Simple and Effective Subword Regularization.* Proceedings of the 58th Annual Meeting of the Association for Computational Linguistics. [arXiv:1910.13267](https://arxiv.org/abs/1910.13267)