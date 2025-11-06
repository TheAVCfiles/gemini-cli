# Automated Product Pipeline

This prototype mirrors the three-engine workflow described in the "Aura Life OS"
case study. Each module is intentionally lightweight so it can be executed end to
end without external services.

## Requirements

Install the lightweight Python dependencies before running the script:

```bash
pip install pandas vaderSentiment
```

## Workflow overview

1. **analysis_engine** – Correlates mocked Shopify sales events with qualitative
   feedback to surface the dominant churn driver.
2. **strategy_engine** – Matches the churn driver against a rules-based playbook
   to generate a new product configuration.
3. **assembly_engine** – Blends brand DNA with the offer configuration to mock the
   creative assets that would normally be produced via generative AI services.

Running the script prints the pipeline logs to standard output and returns the
mock CMS URL for the newly configured product.

```bash
python pipeline.py
```

All network calls are mocked so the script can be safely executed in offline
scenarios or as part of automated examples.
