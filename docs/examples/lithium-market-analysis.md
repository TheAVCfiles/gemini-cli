# Analyze lithium-linked assets with Gemini CLI

This example shows how to explore a small multi-asset time series (Ethereum, lithium spot prices, and the Global X Lithium & Battery Tech ETF) directly from Gemini CLI. The workflow keeps everything local: save the CSV, stream it to the CLI, and ask Gemini to surface trends or correlations.

## Sample dataset

Save the following data to `data/lithium-basket.csv`:

```text
date,ETH,LI_SPOT,LIT
2021-01-01,730.12,6500,47.21
2021-02-01,1314.89,6850,60.17
2021-03-01,1423.65,7225,62.41
2021-04-01,1979.12,6950,67.39
2021-05-01,2741.19,7050,68.52
```

> **Note:** Extend the dataset with additional rows (for example, daily or weekly closes) to improve the analysis quality. The CLI can ingest much larger CSVs; just be mindful of the model's token limits.

## Ask Gemini for a structured analysis

Use non-interactive mode so the CLI exits after the response. Pipe the CSV into the prompt so Gemini can read the raw data:

```bash
cat data/lithium-basket.csv | gemini -p "Summarize price trends and identify any correlations between ETH, LI_SPOT, and LIT."
```

Gemini will parse the table, run quick descriptive statistics, and return a narrative that calls out:

- Momentum shifts (for example, Ethereum's surge between February and May 2021).
- Comovement between the lithium spot series and the LIT ETF.
- Additional questions or follow-up tasks, such as forecasting or volatility checks.

## Iterate with follow-up prompts

Because the CLI preserves context across commands in the same session, you can ask refinement questions right away:

```bash
gemini -p "Given the previous CSV, project the 3-month moving average for each column and explain the implications for 2021 demand." 
```

Or capture ideas for further research:

```bash
gemini -p "List three external datasets that would help validate the lithium demand thesis that emerged from the CSV analysis." 
```

Mixing structured data with conversational prompts makes it easy to prototype commodity and crypto research loops without leaving the terminal.
