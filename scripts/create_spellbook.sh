#!/usr/bin/env bash
set -euo pipefail

# create_spellbook.sh
# Usage:
#   chmod +x create_spellbook.sh
#   ./create_spellbook.sh
#
# This script creates a Decrypt_Spellbook folder with:
#  - tools/ingest_astro_events.py
#  - tools/run_both.sh
#  - tools/requirements.txt
#  - evaluate_extraction.py
#  - docs/index.html, manifest.json, sw.js
#  - toolbox.html (a compact white-label toolbox)
#  - .github/workflows/release_spellbook.yml
#  - create_spellbook_release.sh
# Then it zips Decrypt_Spellbook.zip and base64-encodes to Decrypt_Spellbook.zip.b64

ROOTDIR="$(pwd)"
OUTDIR="$ROOTDIR/Decrypt_Spellbook"
TOOLS="$OUTDIR/tools"
DOCS_DIR="$OUTDIR/docs"
WORKFLOWS_DIR="$OUTDIR/.github/workflows"

echo "Creating Decrypt_Spellbook at: $OUTDIR"

# cleanup
rm -rf "$OUTDIR" "$ROOTDIR/Decrypt_Spellbook.zip" "$ROOTDIR/Decrypt_Spellbook.zip.b64"

mkdir -p "$TOOLS"
mkdir -p "$DOCS_DIR"
mkdir -p "$WORKFLOWS_DIR"

# --------------------------
# 1) tools/ingest_astro_events.py
# --------------------------
cat > "$TOOLS/ingest_astro_events.py" <<'PY'
#!/usr/bin/env python3
"""
Simple event ingestion script.
Scans text files in an input dir, extracts dates and simple labels using regex,
and writes a CSV with: id, source, text, pred_label, pred_dates

This is a pragmatic reverse-engineer style extractor that:
 - finds dates (ISO / MM/DD/YYYY / Month Day Year)
 - finds common astrological keywords (conjunction, opposition, trine, square, transit, progress)
 - emits JSON list of detected dates as pred_dates
"""
import argparse, re, csv, json, os, sys
from dateutil import parser as du_parser

DATE_PATTERNS = [
    # ISO
    r'\b\d{4}-\d{2}-\d{2}\b',
    # Month Day, Year (e.g., July 12, 2025)
    r'\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:,?\s+\d{4})?\b',
    # mm/dd/yyyy
    r'\b\d{1,2}/\d{1,2}/\d{2,4}\b',
]

LABEL_KEYWORDS = [
    "conjunction","opposition","trine","square","sextile",
    "transit","progression","solar return","arc","launch","invoice","sale"
]

def find_dates(text):
    found = set()
    for p in DATE_PATTERNS:
        for m in re.findall(p, text, flags=re.IGNORECASE):
            try:
                dt = du_parser.parse(m, fuzzy=True)
                found.add(dt.date().isoformat())
            except Exception:
                continue
    return sorted(found)

def find_label(text):
    text_l = text.lower()
    for kw in LABEL_KEYWORDS:
        if kw in text_l:
            return kw
    return ""

def process_file(path, source):
    lines = []
    with open(path, 'r', encoding='utf8', errors='ignore') as f:
        content = f.read()
    # naive split by paragraphs
    paras = [p.strip() for p in re.split(r'\n\s*\n', content) if p.strip()]
    for i,p in enumerate(paras):
        dates = find_dates(p)
        label = find_label(p)
        lines.append({
            'id': f"{source}-{i}",
            'source': source,
            'text': p,
            'pred_label': label,
            'pred_dates': json.dumps(dates)
        })
    return lines

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--input-dir', required=True, help='dir with .txt / .md / .html files')
    ap.add_argument('--output-csv', default='astro_events.csv')
    args = ap.parse_args()

    rows = []
    for root,_,files in os.walk(args.input_dir):
        for fn in files:
            if fn.lower().endswith(('.txt','.md','.html','.json')):
                path = os.path.join(root,fn)
                try:
                    rows.extend(process_file(path, fn))
                except Exception as e:
                    print("Warning: failed to parse",path, e, file=sys.stderr)
    # write CSV
    with open(args.output_csv,'w',newline='',encoding='utf8') as f:
        w = csv.DictWriter(f, fieldnames=['id','source','text','pred_label','pred_dates'])
        w.writeheader()
        for r in rows:
            w.writerow(r)
    print("Wrote", args.output_csv, "rows:", len(rows))

if __name__ == '__main__':
    main()
PY
chmod +x "$TOOLS/ingest_astro_events.py"

# --------------------------
# 2) tools/requirements.txt
# --------------------------
cat > "$TOOLS/requirements.txt" <<'REQ'
pandas
python-dateutil
python-dotenv
requests
flask
pytest
REQ

# --------------------------
# 3) tools/run_both.sh
# --------------------------
cat > "$TOOLS/run_both.sh" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
# run_both.sh
# Usage: ./run_both.sh --input-dir ../sample_chats [--openai] [--gemini]
# Creates astro_events.csv via ingest_astro_events.py and optionally calls LLMs (placeholder).

SCRIPTDIR="$(cd "$(dirname "$0")" && pwd)"
INPUT_DIR="${1:-../sample_chats}"
shift || true

# setup venv if missing
if [ ! -d venv ]; then
  python3 -m venv venv
  source venv/bin/activate
  pip install --upgrade pip
  pip install -r requirements.txt
else
  source venv/bin/activate
fi

python3 ingest_astro_events.py --input-dir "$INPUT_DIR" --output-csv ../astro_events.csv

echo "Ingest complete: astro_events.csv"

# Placeholder: call LLM enrichment if flags present
if [[ "$*" == *"--openai"* ]]; then
  echo "LLM enrichment with OpenAI requested (placeholder). Set OPENAI_API_KEY env var & implement enrichment."
fi
if [[ "$*" == *"--gemini"* ]]; then
  echo "LLM enrichment with Gemini requested (placeholder). Set GEMINI_KEY env var & implement enrichment."
fi

echo "Done."
SH
chmod +x "$TOOLS/run_both.sh"

# --------------------------
# 4) evaluate_extraction.py (core evaluator)
# --------------------------
cat > "$OUTDIR/evaluate_extraction.py" <<'PY'
#!/usr/bin/env python3
# (Same as previously provided evaluate_extraction.py)
import argparse, json
from datetime import datetime
from collections import defaultdict
import pandas as pd
from dateutil import parser as du_parser

def parse_dates_field(v):
    if pd.isna(v) or v == '':
        return []
    try:
        lst = json.loads(v)
        if isinstance(lst, list):
            out = []
            for x in lst:
                if x is None: continue
                s = str(x)
                if '/' in s:
                    a,b = s.split('/',1)
                    out.append(a.strip())
                    out.append(b.strip())
                else:
                    out.append(s.strip())
            return out
    except Exception:
        parts = [p.strip() for p in str(v).split(',') if p.strip()]
        return parts
    return []

def normalize_label(s):
    if s is None:
        return ''
    return str(s).strip().lower()

def parse_date_best(s):
    if s is None:
        return None
    s = str(s).strip()
    if s == '':
        return None
    try:
        return du_parser.parse(s)
    except Exception:
        try:
            return datetime.fromisoformat(s)
        except Exception:
            return None

def date_within_tol(dp, dg, tol_days=3):
    if dp is None or dg is None:
        return False
    delta = abs((dp.date() - dg.date()).days)
    return delta <= tol_days

def evaluate(gold_df, pred_df, tol_days=3):
    if 'id' in gold_df.columns and 'id' in pred_df.columns:
        merged = gold_df.merge(pred_df, on='id', suffixes=('_gold','_pred'), how='left')
    else:
        merged = gold_df.merge(pred_df, on=['source','text'], suffixes=('_gold','_pred'), how='left')

    total = len(merged)
    tp = fp = fn = 0
    per_label = defaultdict(lambda: {'tp':0,'fp':0,'fn':0})
    date_total = 0
    date_matches = 0

    for _, row in merged.iterrows():
        gold_label = normalize_label(row.get('gold_label') or row.get('label') or '')
        pred_label = normalize_label(row.get('pred_label') or row.get('llm_label') or '')
        gold_dates = parse_dates_field(row.get('gold_dates') or row.get('parsed_date') or '[]')
        pred_dates = parse_dates_field(row.get('pred_dates') or row.get('llm_dates') or '[]')

        if gold_label:
            if pred_label == gold_label:
                tp += 1
                per_label[gold_label]['tp'] += 1
            else:
                fn += 1
                per_label[gold_label]['fn'] += 1
                if pred_label:
                    fp += 1
                    per_label[pred_label]['fp'] += 1
        else:
            if pred_label:
                fp += 1
                per_label[pred_label]['fp'] += 1

        if gold_dates:
            date_total += 1
            parsed_gold = [parse_date_best(x) for x in gold_dates]
            parsed_pred = [parse_date_best(x) for x in pred_dates]
            matched = False
            for dg in parsed_gold:
                for dp in parsed_pred:
                    if dg and dp and date_within_tol(dp, dg, tol_days):
                        matched = True
                        break
                if matched:
                    break
            if matched:
                date_matches += 1

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0
    date_match_rate = date_matches / date_total if date_total > 0 else None

    per_label_summary = {}
    for lbl, stats in per_label.items():
        p = stats['tp'] / (stats['tp'] + stats['fp']) if (stats['tp'] + stats['fp'])>0 else 0.0
        r = stats['tp'] / (stats['tp'] + stats['fn']) if (stats['tp'] + stats['fn'])>0 else 0.0
        f = 2 * p * r / (p + r) if (p + r) > 0 else 0.0
        per_label_summary[lbl] = {'precision': round(p,4), 'recall': round(r,4), 'f1': round(f,4), 'tp': stats['tp'], 'fp': stats['fp'], 'fn': stats['fn']}

    res = {
        'total_rows': total,
        'precision': round(precision,4),
        'recall': round(recall,4),
        'f1': round(f1,4),
        'tp': tp, 'fp': fp, 'fn': fn,
        'date_total': date_total,
        'date_matches': date_matches,
        'date_match_rate': round(date_match_rate,4) if date_match_rate is not None else None,
        'per_label': per_label_summary
    }
    return res

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--gold', required=True)
    p.add_argument('--pred', required=True)
    p.add_argument('--date-tolerance', type=int, default=3)
    p.add_argument('--out', default=None)
    args = p.parse_args()

    gold_df = pd.read_csv(args.gold, dtype=str).fillna('')
    pred_df = pd.read_csv(args.pred, dtype=str).fillna('')

    report = evaluate(gold_df, pred_df, tol_days=args.date_tolerance)
    print(json.dumps(report, indent=2, default=str))
    if args.out:
        with open(args.out, 'w') as f:
            json.dump(report, f, indent=2, default=str)

if __name__ == '__main__':
    main()
PY
chmod +x "$OUTDIR/evaluate_extraction.py"

# --------------------------
# 5) toolbox.html (compact)
# --------------------------
cat > "$OUTDIR/toolbox.html" <<'HTML'
<!doctype html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Decrypt Spellbook — Toolbox</title>
<style>
body{font-family:Inter,system-ui,Arial;background:#fcfcf9;margin:0;padding:18px;color:#0f1724}
.card{background:#fff;padding:14px;border-radius:12px;box-shadow:0 8px 30px rgba(2,6,23,0.06);margin-bottom:12px}
h1{margin:0 0 8px;font-size:20px}
.small{color:#6b7280;font-size:13px}
pre{background:#0b1220;color:#e6eef6;padding:10px;border-radius:8px;overflow:auto}
.btn{display:inline-block;background:#0d9488;color:white;padding:8px 12px;border-radius:8px;text-decoration:none}
</style>
</head>
<body>
  <div class="card">
    <h1>Decrypt Spellbook — Toolbox</h1>
    <p class="small">This toolbox is the white-label kit: heuristic ingest, evaluation, and run scripts.</p>
    <p><a class="btn" href="tools/run_both.sh" download>Download Run Script</a></p>
  </div>

  <div class="card">
    <h2>How to run locally</h2>
    <pre>
# unzip and move to folder:
cd Decrypt_Spellbook/tools
chmod +x run_both.sh
./run_both.sh ../sample_chats
    </pre>
    <p class="small">Open toolbox.html via GitHub Pages or serve locally:</p>
    <pre>python3 -m http.server 8080</pre>
  </div>

  <div class="card">
    <h2>Quick Examples</h2>
    <p class="small">Evaluate predictions vs gold:</p>
    <pre>python3 ../evaluate_extraction.py --gold ../gold.csv --pred ../astro_events.csv --date-tolerance 3</pre>
  </div>
</body>
</html>
HTML

# --------------------------
# 6) docs/index.html (the mobile-friendly showcase)
# --------------------------
cat > "$DOCS_DIR/index.html" <<'HTML'
<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>DeCrypt — Astro × Finance — Demo & Spellbook</title>
<link rel="manifest" href="/manifest.json">
<style>
:root{--bg:#fcfcf9;--card:#fff;--accent:#0d9488;--muted:#6b7280}
body{background:var(--bg);font-family:Inter,system-ui,Arial;color:#0f1724;margin:0}
.wrap{max-width:980px;margin:0 auto;padding:20px}
.card{background:var(--card);padding:14px;border-radius:12px;margin-bottom:12px;box-shadow:0 8px 30px rgba(2,6,23,0.06)}
.logo{width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg,#0d9488,#0f766e);display:inline-flex;align-items:center;justify-content:center;color:white;font-weight:700;margin-right:10px}
h1{font-size:22px;margin:0}
.small{color:var(--muted);font-size:13px}
.btn{background:var(--accent);color:white;padding:10px 12px;border-radius:10px;text-decoration:none}
pre{background:#0b1220;color:#e6eef6;padding:10px;border-radius:8px;overflow:auto}
</style>
</head><body>
<div class="wrap">
  <div class="card" style="display:flex;align-items:center;justify-content:space-between">
    <div style="display:flex;align-items:center">
      <div class="logo">AVC</div>
      <div>
        <div style="font-weight:700">DeCrypt — Astro × Finance</div>
        <div class="small">Interactive demos · Spellbook · Tooling</div>
      </div>
    </div>
    <div>
      <a class="btn" href="/Decrypt_Spellbook.zip" download>Download Spellbook ZIP</a>
    </div>
  </div>

  <div class="card">
    <h1>Try the Toolbox</h1>
    <p class="small">Open the embedded Toolbox or run locally. For iPhone: Add to Home Screen for full-screen experience.</p>
    <iframe src="/Decrypt_Spellbook/toolbox.html" style="width:100%;height:420px;border:0;border-radius:8px"></iframe>
  </div>

  <div class="card">
    <h2>Quick-run</h2>
    <pre>cd Decrypt_Spellbook/tools
chmod +x run_both.sh
./run_both.sh ../sample_chats</pre>
  </div>

  <div class="card" style="text-align:center">
    <small>© Allison Van Cura — DeCrypt</small>
  </div>
</div>
</body></html>
HTML

# --------------------------
# 7) docs/manifest.json & docs/sw.js
# --------------------------
cat > "$DOCS_DIR/manifest.json" <<'JSON'
{
  "name": "DeCrypt Spellbook",
  "short_name": "DeCrypt",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#fcfcf9",
  "theme_color": "#0d9488",
  "icons": []
}
JSON

cat > "$DOCS_DIR/sw.js" <<'JS'
const CACHE = 'decrypt-v1';
const OFFLINE = ['/', '/Decrypt_Spellbook/toolbox.html'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(OFFLINE)));
  self.skipWaiting();
});
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(resp => resp || fetch(e.request).catch(()=>caches.match('/'))));
});
JS

# --------------------------
# 8) .github/workflows/release_spellbook.yml
# --------------------------
cat > "$WORKFLOWS_DIR/release_spellbook.yml" <<'YAML'
name: Build & Release Decrypt Spellbook

on:
  workflow_dispatch:
  push:
    branches:
      - main

jobs:
  build-and-release:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repo
        uses: actions/checkout@v4

      - name: Ensure zip tool
        run: sudo apt-get update && sudo apt-get install -y zip

      - name: Create ZIP of Decrypt_Spellbook
        run: |
          if [ -d "Decrypt_Spellbook" ]; then
            rm -f Decrypt_Spellbook.zip
            zip -r Decrypt_Spellbook.zip Decrypt_Spellbook
            ls -lh Decrypt_Spellbook.zip
          else
            echo "Decrypt_Spellbook folder not found; zipping docs only"
            zip -r Decrypt_Spellbook.zip docs || true
            ls -lh Decrypt_Spellbook.zip
          fi

      - name: Create GitHub Release and upload ZIP
        uses: ncipollo/release-action@v1
        with:
          tag: "spellbook-${{ github.sha }}"
          name: "Decrypt_Spellbook ${{ github.sha }}"
          body: "Automated Spellbook release (zip) built by CI."
          files: "Decrypt_Spellbook.zip"
YAML

# --------------------------
# 9) create_spellbook_release.sh (local helper, uses gh)
# --------------------------
cat > "$OUTDIR/create_spellbook_release.sh" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
TAG="${1:-spellbook-local}"
NAME="${2:-Decrypt_Spellbook}"
ZIP="${3:-Decrypt_Spellbook.zip}"

if [ ! -f "$ZIP" ]; then
  if [ -d "Decrypt_Spellbook" ]; then
    zip -r "$ZIP" Decrypt_Spellbook
  else
    echo "Decrypt_Spellbook folder not found. Create it first."
    exit 1
  fi
fi

echo "Creating release $TAG with asset $ZIP"
gh release create "$TAG" "$ZIP" --title "$NAME" --notes "Automated local Spellbook release: $TAG"
echo "Release created."
SH
chmod +x "$OUTDIR/create_spellbook_release.sh"

# --------------------------
# 10) README top-level
# --------------------------
cat > "$OUTDIR/README.md" <<'MD'
# Decrypt Spellbook (Minimal)

This is the Decrypt Spellbook white-label toolkit.
- tools/: ingestion and run scripts
- toolbox.html: lightweight demo
- evaluate_extraction.py: evaluator script
- docs/: a mobile-friendly showcase index

Run:
  cd Decrypt_Spellbook/tools
  chmod +x run_both.sh
  ./run_both.sh ../sample_chats

Evaluate:
  cd ..
  python3 ../evaluate_extraction.py --gold ../gold.csv --pred ../astro_events.csv
MD

# --------------------------
# 11) Create a small sample_chats folder with sample file
# --------------------------
mkdir -p "$OUTDIR/sample_chats"
cat > "$OUTDIR/sample_chats/sample1.txt" <<'SAMPLE'
Mars conjunct Jupiter on 2025-07-12 — strong conjunction. Expect opportunity.
Client invoiced on 2024-08-01 — invoice 1234 $450.
Transit: Saturn square Sun 2025-10-05.
SAMPLE

# --------------------------
# 12) Zip and base64 encode the Spellbook
# --------------------------
echo "Zipping $OUTDIR to Decrypt_Spellbook.zip ..."
cd "$ROOTDIR"
rm -f Decrypt_Spellbook.zip Decrypt_Spellbook.zip.b64
zip -r Decrypt_Spellbook.zip Decrypt_Spellbook >/dev/null

echo "Base64-encoding Decrypt_Spellbook.zip to Decrypt_Spellbook.zip.b64 ..."
base64 Decrypt_Spellbook.zip > Decrypt_Spellbook.zip.b64

echo "Created Decrypt_Spellbook.zip and Decrypt_Spellbook.zip.b64 in: $ROOTDIR"
echo
echo "To decode on any machine:"
echo "  base64 -d Decrypt_Spellbook.zip.b64 > Decrypt_Spellbook.zip"
echo "  unzip Decrypt_Spellbook.zip -d Decrypt_Spellbook"
echo
echo "To create a GitHub release (requires gh CLI):"
echo "  ./Decrypt_Spellbook/create_spellbook_release.sh spellbook-v1 'Decrypt Spellbook v1' Decrypt_Spellbook.zip"
echo
echo "DONE."
