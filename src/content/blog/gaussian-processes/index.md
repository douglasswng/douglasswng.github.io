---
title: Gaussian Processes
date: 2025-10-20
topics: [gaussian-processes, bayesian-methods, uncertainty-quantification]
status: evergreen
---
## Overview
A Bayesian non-parametric approach that provides predictions with uncertainty estimates by treating functions as random variables.

## Key Ideas
- **Distribution over functions**: Gaussian process defines a distribution where any finite collection of function values follows a joint multivariate normal distribution
- **Uncertainty quantification**: Unlike models that only give predictions, GPs provide both prediction and confidence
- **Kernel-based**: Similarity between inputs determines function smoothness

## Details

### High-Level Overview

#### Gaussian Process Definition
- Viewed as a distribution on functions
- Any finite collection of random variables follows a joint multivariate normal distribution
- Fully specified by:
  - Mean function: $m(x)$
  - Covariance function (kernel): $k(x, x')$

#### Advantages over Traditional Methods
- Most ML models give prediction given input
- GPs give prediction **and confidence**
- Alternative: Fit linear regression then estimate variance, but this misses uncertainty in the fitted line itself

#### Kernel Function
- Measures similarity between inputs
- "A GP will sample functions with nearby $y$'s for $x$'s deemed similar by the kernel"
- Example: RBF kernel (where similarity means close in L2 sense) produces smooth sample functions

### Mathematical Detail

#### Gaussian Process Notation
Written as $f(x) \sim \mathcal{GP}(m(x), k(x, x'))$ where:
- $m(x) = \mathbb{E}[f(x)]$
- $k(x, x') = \mathbb{E}[(f(x) - m(x))(f(x') - m(x'))]$

#### Prior Specification
- Typically assume $m(x) = 0$ (can always subtract mean from dataset)
- Choose kernel function (e.g., RBF, Matérn, periodic)

#### Posterior Predictive Distribution
Given observed data:
- Inputs: $X = \{x_1, x_2, \dots, x_n\}$
- Outputs: $Y = \{y_1, y_2, \dots, y_n\}$

The GP posterior is computed by conditioning the prior on observed data, updating mean and covariance functions.

For new input $x_{\ast}$, the posterior predictive distribution is Gaussian:

$$f(x_{\ast}) \sim \mathcal{N}(\mu_{\ast}, \sigma_{\ast}^2)$$

where:
- $\mu_{\ast} = k(x_{\ast}, X)K^{-1}Y$
- $\sigma_{\ast}^2 = k(x_{\ast}, x_{\ast}) - k(x_{\ast}, X)K^{-1}k(X, x_{\ast})$

Components:
- $k(x_{\ast}, X)$: vector of covariances between new input $x_{\ast}$ and observed inputs $X$
- $K = k(X, X)$: covariance matrix of observed inputs (Gram matrix)
- $k(X, x_{\ast})$: transpose of $k(x_{\ast}, X)$

## References
- [YouTube: Gaussian Processes Explained](https://www.youtube.com/watch?v=UBDgSHPxVME)
- Oxford notes (ATSM)

