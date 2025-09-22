#!/usr/bin/env bash
set -euo pipefail

PATCH_DIR="${1:-_mwra_patch}"

if [ ! -d "$PATCH_DIR" ]; then
  echo "Patch directory '$PATCH_DIR' not found. Pass the extracted bundle directory as the first argument." >&2
  exit 1
fi

echo "Applying MWRA glossary bundle from $PATCH_DIR";

mkdir -p web netlify/functions

cp -f "$PATCH_DIR/web/glossary.json" web/glossary.json
cp -f "$PATCH_DIR/web/boot_glossary.js" web/boot_glossary.js
cp -f "$PATCH_DIR/netlify/functions/ask.js" netlify/functions/ask.js
cp -f "$PATCH_DIR/netlify.toml" netlify.toml
cp -f "$PATCH_DIR/README.md" README.md

INDEX_FILE="web/index.html"
SCRIPT_TAG='<script src="boot_glossary.js"></script>'
if [ -f "$INDEX_FILE" ]; then
  if ! grep -q "boot_glossary.js" "$INDEX_FILE"; then
    echo "Injecting boot_glossary.js loader into $INDEX_FILE"
    tmp_file="${INDEX_FILE}.tmp"
    awk -v tag="$SCRIPT_TAG" 'BEGIN{IGNORECASE=1} /<\/body>/{print "  " tag; injected=1} {print} END{if(!injected) print "  " tag}' "$INDEX_FILE" > "$tmp_file"
    mv "$tmp_file" "$INDEX_FILE"
  else
    echo "Existing boot_glossary.js reference detected in $INDEX_FILE"
  fi
else
  echo "Creating new $INDEX_FILE"
  cat > "$INDEX_FILE" <<'HTML'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MWRA Interactive Glossary</title>
  </head>
  <body>
    <div id="app-root"></div>
    <script src="boot_glossary.js"></script>
  </body>
</html>
HTML
fi

echo "All files copied. Review changes with 'git status' before committing."
