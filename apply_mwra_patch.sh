#!/usr/bin/env bash
set -euo pipefail

DEFAULT_PATCH_DIR="_mwra_patch"
PATCH_DIR="$DEFAULT_PATCH_DIR"
DOWNLOAD=false
BUNDLE_URL="https://platform.openai.com/storage/vector_stores/vs_6859e43920848191a894dd36ecf0595a/mwra-glossary-firebase.zip?download=1"

print_usage() {
  cat <<'USAGE'
Usage: bash apply_mwra_patch.sh [bundle_dir] [--download] [--bundle-url <url>]

Copies the MWRA glossary bundle into the current repository. By default the
script expects an already-extracted bundle directory. Pass --download to fetch
and unpack the latest published archive automatically.

Options:
  bundle_dir        Directory containing the extracted bundle. Defaults to
                    "_mwra_patch".
  --download        Download and unpack the official bundle before applying it.
  --bundle-url URL  Override the download URL used with --download.
  -h, --help        Show this message.
USAGE
}

if [[ $# -gt 0 ]]; then
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --download)
        DOWNLOAD=true
        shift
        ;;
      --bundle-url)
        if [[ $# -lt 2 ]]; then
          echo "Missing URL for --bundle-url." >&2
          exit 1
        fi
        BUNDLE_URL="$2"
        shift 2
        ;;
      -h|--help)
        print_usage
        exit 0
        ;;
      --*)
        echo "Unknown option: $1" >&2
        print_usage >&2
        exit 1
        ;;
      *)
        if [[ "$PATCH_DIR" != "$DEFAULT_PATCH_DIR" ]]; then
          echo "Multiple bundle directories provided." >&2
          exit 1
        fi
        PATCH_DIR="$1"
        shift
        ;;
    esac
  done
fi

trap_cleanup=false

if $DOWNLOAD; then
  if ! command -v curl >/dev/null 2>&1; then
    echo "curl is required when using --download." >&2
    exit 1
  fi
  if ! command -v unzip >/dev/null 2>&1; then
    echo "unzip is required when using --download." >&2
    exit 1
  fi

  echo "Downloading MWRA glossary bundle from $BUNDLE_URL"
  tmp_zip="$(mktemp)"
  cleanup() {
    rm -f "$tmp_zip"
  }
  trap cleanup EXIT
  trap_cleanup=true

  curl -fL "$BUNDLE_URL" -o "$tmp_zip"

  rm -rf "$PATCH_DIR"
  mkdir -p "$PATCH_DIR"
  if unzip -Z1 "$tmp_zip" | grep -q -e '^/' -e '\.\.'; then
    echo "Error: Archive contains invalid file paths (absolute or traversal)." >&2
    exit 1
  fi
  unzip -q "$tmp_zip" -d "$PATCH_DIR"
else
  if [ ! -d "$PATCH_DIR" ]; then
    echo "Patch directory '$PATCH_DIR' not found. Pass the extracted bundle directory as the first argument or use --download." >&2
    exit 1
  fi
fi

BUNDLE_ROOT="$PATCH_DIR"
if [ ! -f "$BUNDLE_ROOT/web/glossary.json" ]; then
  while IFS= read -r potential_dir; do
    if [ -f "$potential_dir/web/glossary.json" ]; then
      BUNDLE_ROOT="$potential_dir"
      break
    fi
  done < <(find "$BUNDLE_ROOT" -mindepth 1 -maxdepth 1 -type d | sort)
fi

for required in \
  "web/glossary.json" \
  "web/boot_glossary.js" \
  "netlify/functions/ask.js" \
  "netlify.toml" \
  "README.md"; do
  if [ ! -e "$BUNDLE_ROOT/$required" ]; then
    echo "Required file '$required' not found in '$BUNDLE_ROOT'." >&2
    exit 1
  fi
done

if $trap_cleanup; then
  trap - EXIT
  cleanup || true
fi

echo "Applying MWRA glossary bundle from $BUNDLE_ROOT"

mkdir -p web netlify/functions

cp -f "$BUNDLE_ROOT/web/glossary.json" web/glossary.json
cp -f "$BUNDLE_ROOT/web/boot_glossary.js" web/boot_glossary.js
cp -f "$BUNDLE_ROOT/netlify/functions/ask.js" netlify/functions/ask.js
cp -f "$BUNDLE_ROOT/netlify.toml" netlify.toml
cp -f "$BUNDLE_ROOT/README.md" README.md

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
