# Appendix A: Notation & Defaults

## A.1 Symbols

| Symbol | Meaning |
| --- | --- |
| $C$ | Current price (close) |
| $A$ | Harmonic unit $A = \frac{\max(\text{swing}) - \min(\text{swing})}{6}$ (4h swing) |
| `guard_low` | $C - 0.5A$ |
| `pivot_{45d}` | $C - A$ |
| `ang_{45}` | $C + A$ |
| `ang_{90}` | $C + 1.5A$ |
| `ang_{180}` | $C + 2.5A$ |
| $\mathrm{TRI}^*$ | Composite anomaly score (weighted standardized signals) |
| $T$ | Baseline window length (minutes) for $z$-scores |
| $g$ | Exclusion gap (minutes) before the most recent bar |
| $\tau^*$ | Lead--lag regime indicator (ETH vs BTC) |
| $D_0$ | Default traversal budget (ticks) |
| $D$ | Elastic traversal budget (ticks), see [Section A.5](#a5-elastic-deadline-balanchine-mode) |

## A.2 Default Parameters (recommended)

| Component | Default |
| --- | --- |
| Swing window (SWN) | 240 minutes (4h) |
| Harmonic divisor | $6$ (i.e., $A = \text{range} / 6$) |
| $\epsilon$ (level proximity) | $0.75$ price units |
| $\mathrm{TRI}^*$ baseline $(T, g)$ | $(120, 10)$ minutes |
| $\mathrm{TRI}^*$ threshold | $2.5$ (two-sided) |
| Weights $w$ | $w_{\text{px}} = 0.6,\; w_{\text{vol}} = 0.4$ |
| (Optional) added signals | $w_{\text{gas}} = 0.25,\; w_{\text{oi}} = 0.3,\; w_{\text{fnd}} = -0.2,\; w_{\text{mp}} = -0.2$ |
| Lead--lag lags $L$ | $3$ (0–3 min) |
| Lead--lag window $W$ | $240$ minutes (rolling OLS) |
| Elastic deadline $D_0$ | $4$ ticks (Physics: fixed) |
| Elastic adjust (Balanchine) | $+1$ if $\mathrm{tri} \ge 4.5$; $-1$ if $\tau^* \le -7$; clip to $[2, 12]$ |
| Risk cap | $50$ bps per entry (*no tactical scale-in*) |
| Persistence $m$ | $3$ bars for kinematic confirmation |

## A.3 $\mathrm{TRI}^*$ definition

Let $r_t$ be the 1-minute return and $v_t$ the 1-minute volume. Compute baselines on the window $[t - (T + g),\, t - g]$:

$$
S_{\text{px}}(t) = \frac{r_t - \mu_r}{\max(\sigma_r, 10^{-9})}, \qquad
S_{\text{vol}}(t) = \frac{v_t - \mu_v}{\max(\sigma_v, 10^{-9})}.
$$

For any optional signal $S_k$ (gas, funding, open interest change, point-of-control distance), standardize analogously. Fuse only available signals:

$$
\mathrm{TRI}^*(t) = \frac{\sum_{k \in \mathcal{A}(t)} w_k S_k(t)}{\max\left(\sum_{k \in \mathcal{A}(t)} w_k,\, 1\right)}.
$$

## A.4 Lead--lag $\tau^*$ (rolling)

Fit an ordinary least squares (OLS) regression on the rolling window $W$:

$$
r^{\text{ETH}}_t = \sum_{\ell = 0}^{L} \beta_\ell \, r^{\text{BTC}}_{t - \ell} + \varepsilon_t,
$$

then define

$$
\tau^* = \arg\max_{\ell \in [0, L]} \left|\hat{\beta}_\ell\right| \cdot \operatorname{sign}(\hat{\beta}_\ell),
$$

and flag ``confidence interval excludes $0$'' via Newey--West or bootstrap. Interpretation: $\tau^* > 0$ means ETH leads; $\tau^* < 0$ means BTC leads; values near $0$ indicate co-movement.

## A.5 Elastic deadline (Balanchine Mode)

$$
D = \operatorname{clip}\Big(D_0 + \mathbf{1}[\mathrm{tri} \ge 4.5] - \mathbf{1}[\tau^* \le -7],\, 2,\, 12\Big).
$$

Physics Mode uses $D = D_0$.

## A.6 Cue/state mapping (operational)

| State | Entry condition | Exit / transition |
| --- | --- | --- |
| IDLE | — | GLISS\!ADE if structure $\ge 85$, CI$(\tau^*) \ne 0$, near level |
| PREP (Glissade) | As above; timer $D$ starts | JET'\!E on glitch confirm; `CORPS_RESET` on timeout / negate |
| JET'\!E | Position live | `CODA_PROFIT` on target; `CODA_STOP` on stop; FERMATA on volatility spike |
| FERMATA | Volatility spike (pause) | Resume JET'\!E on stabilization; `CORPS_RESET` on break |
| `CODA_*` / `CORPS_RESET` | Exit / flatten | Return to IDLE |

## A.7 Reproducibility knobs (single place)

- **Data:** 1-minute bars (spot and perpetuals), session swing window $= 240$ minutes.
- **Baselines:** $(T, g) = (120, 10)$; for robustness, use median / MAD instead of mean / standard deviation.
- **Levels:** compute $A$ from the same 4-hour swing; refresh each bar.
- **Gates:** $\mathrm{TRI}^* > 2.5$; proximity $|C - \text{level}| \le \epsilon$; CI$(\tau^*) \ne 0$.
- **Risk:** cap 50 bps per entry; no tactical adds; trailing based on structure.
