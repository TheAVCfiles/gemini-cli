# Market Physics Lab — Operational Notes

Lock down the correlations workflow before swapping in production data. Use this page as the guardrail checklist when you rerun the experiment or hand it to engineering.

## 1. Sanity checks on the correlation sweep

- **Best lag**: \(\tau^{\*} = -29\). Negative lag means LIT leads ETH by roughly 29 trading days under the current sign convention (positive \(\tau\) ⇒ ETH leads).
- **Peak correlation**: \(r(\tau^{\*}) \approx 0.141\) with a 95% confidence interval of \([0.001, 0.285]\). Because the interval excludes 0 after detrending, the linear link at that lag is statistically non-zero.
- **Permutation harness**: keep the weekday-matched shuffle with the +1 correction so the p-values stay conservative even when tap density is sparse.

## 2. File schemas (swap-friendly contracts)

Use the following column layouts verbatim so downstream notebooks and dashboards continue to parse without rewiring.

### `prices_daily.csv`

| Column | Type | Notes |
| --- | --- | --- |
| `date` | ISO `YYYY-MM-DD` | Trading day (timezone-normalised to UTC close).
| `symbol` | Enum (`"LIT"`, `"ETH"`) | Asset identifier so one table covers both instruments.
| `close_usd` | Number | Adjusted close in USD; split- and fork-adjusted.
| `volume` | Number | Daily traded volume (shares for LIT, native units for ETH).
| `return_pct` | Number | Day-over-day log-return expressed as a decimal (e.g., 0.0123 for 1.23%).

### `tap_log.csv`

| Column | Type | Notes |
| --- | --- | --- |
| `tap_id` | String UUID | Stable identifier for each marketing or product tap.
| `timestamp` | ISO 8601 | Exact launch/announcement time in UTC.
| `channel` | String | Surface (e.g., `email`, `x-post`, `site-banner`).
| `theme` | String | Short slug describing the push (e.g., `liquidity`, `roadmap`).
| `notes` | String | Optional freeform annotation for analysts.

### `corr_summary.csv`

| Column | Type | Notes |
| --- | --- | --- |
| `lag_days` | Integer | Lag \(\tau\) in trading days; negative values mean LIT leads.
| `pearson_r` | Number | Correlation coefficient at the specified lag.
| `ci_low` | Number | Lower bound of the 95% bootstrap CI.
| `ci_high` | Number | Upper bound of the 95% bootstrap CI.
| `p_value` | Number | Permutation-test p-value with weekday matching and +1 correction.

Keep these headers frozen. If you need to extend the schema, add new columns to the end so existing parsers remain forward compatible.
