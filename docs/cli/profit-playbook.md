# Profit Multiplier Playbook

The `gemini profit` command generates a quantified, automation-first plan that shows
how much capacity and revenue you can unlock by delegating recurring work to Gemini
CLI. Provide a few business inputs and the CLI returns a 90-day execution blueprint
with ROI math, recommended sprints, and the key metrics to track.

## Why use it?

- **Quantify the upside:** Instantly translate reclaimed hours into dollar value and
  net-new revenue projections so stakeholders can see the business case.
- **Align the team:** Share the suggested execution sprints to keep sales,
  operations, and leadership focused on the same automation backlog.
- **Instrument the win:** The command highlights the leading metrics to monitor so
  you can prove the impact and keep reinvesting in automation.

## Quick start

```bash
# Generate a plan for a 3-person team reclaiming 6 hours each per week
# at a $150 blended rate closing 30% of $12k offers.
gemini profit \
  --team-size 3 \
  --automation-hours 6 \
  --hourly-rate 150 \
  --conversion-rate 0.30 \
  --offer-value 12000 \
  --automation-investment 18000
```

The command prints:

- A summary of your inputs.
- Weekly/annual time savings with the associated labor value.
- Estimated pipeline lift and new revenue based on your close rate and offer value.
- Payback period and ROI multiple against your automation budget.
- A 90-day execution plan with concrete projects and next actions.

## Input reference

| Flag | Description | Default |
| ---- | ----------- | ------- |
| `--team-size` | Number of people whose workload you want to amplify. | `1` |
| `--automation-hours` | Weekly hours per person you expect to hand to automation and Gemini. | `5` |
| `--hourly-rate` | Average blended hourly rate for the team members (USD). | `120` |
| `--conversion-rate` | Expected close rate for new opportunities generated with the freed time (0-1). | `0.25` |
| `--offer-value` | Average revenue per closed deal (USD). | `8000` |
| `--automation-investment` | Year-one tooling/automation budget you want to benchmark ROI against (USD). | `10000` |

## Sharing the blueprint

- Run the command after your weekly retro to keep the team aligned on the next
  high-leverage automation sprint.
- Capture the output with shell redirection to share it in chat or as part of
  your executive update:

```bash
gemini profit --team-size 4 --automation-hours 7 > profit-plan.md
```

## Tip: iterate as you learn

Re-run the command as your conversion rate or average deal size changes. Because the
plan is generated locally you can experiment with aggressive vs. conservative inputs
and present the range of outcomes to leadership when you pitch new automation work.
