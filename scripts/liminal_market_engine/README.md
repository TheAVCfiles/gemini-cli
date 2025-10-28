# Liminal Market Engine Prototype

This directory contains a five-stage local prototype of the "Liminal Market Engine".
Each module is intentionally independent so that the pipeline can be run one stage at
at time while preserving transparent provenance at every step.

## Pipeline stages

1. **stage1_collect.py** – Collects public market-oriented RSS/Atom feeds and logs
   provenance details to `provenance.log` while writing articles to
   `stage1_raw_feeds.json`.
2. **stage2_sentiment.py** – Applies the FinBERT sentiment model to every article
   summary, producing `stage2_sentiment.json` with polarity scores.
3. **stage3_counter_trend.py** – Detects hesitation zones using a rolling average
   across sentiments and persists contrarian signals to `stage3_contrarian.json`.
4. **stage4_clusters.py** – Uses SentenceTransformers embeddings with HDBSCAN to
   map contrarian narratives into liminal clusters saved in `stage4_clusters.json`.
5. **stage5_brief.py** – Generates a daily contrarian index brief and poetic
   coda, storing the final report in `stage5_report.txt`.

Run each stage sequentially from this directory to build the complete dataset and
report.
