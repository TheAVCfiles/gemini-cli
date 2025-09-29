#!/usr/bin/env bash
set -euo pipefail

DEFAULT_PATCH_DIR="_mwra_patch"
PATCH_DIR="$DEFAULT_PATCH_DIR"
DOWNLOAD=false
BUNDLE_URL="https://platform.openai.com/storage/vector_stores/vs_6859e43920848191a894dd36ecf0595a/mwra-glossary-firebase.zip?download=1"
SHA256_EXPECTED=""

print_usage() {
  cat <<'USAGE'
Usage: bash apply_mwra_patch.sh [bundle_dir] [--download] [--bundle-url <url>] [--sha256 <hex>]

Copies the MWRA glossary bundle into the current repository. By default the
script expects an already-extracted bundle directory. Pass --download to fetch
and unpack the latest published archive automatically.

Options:
  bundle_dir        Directory containing the extracted bundle. Defaults to
                    "_mwra_patch".
  --download        Download and unpack the official bundle before applying it.
  --bundle-url URL  Override the download URL used with --download.
  --sha256 HEX      Verify the downloaded archive against this SHA-256 hex sum.
  -h, --help        Show this message.
USAGE
}

if [[ $# -gt 0 && "$1" != --* ]]; then
  PATCH_DIR="$1"
  shift
fi

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
    --sha256)
      if [[ $# -lt 2 ]]; then
        echo "Missing hex digest for --sha256." >&2
        exit 1
      fi
      SHA256_EXPECTED="$2"
      shift 2
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    --*)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
    *)
      echo "Unexpected positional argument: $1" >&2
      exit 1
      ;;
  esac
done

cleanup() {
  if [[ -n "${tmp_zip:-}" ]]; then
    rm -f "$tmp_zip"
  fi
}

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
  if [[ -n "$SHA256_EXPECTED" ]]; then
    if ! command -v sha256sum >/dev/null 2>&1 && ! command -v shasum >/dev/null 2>&1; then
      echo "SHA-256 verification requested but no sha256 tool found (sha256sum/shasum)." >&2
      exit 1
    fi
  fi

  echo "Downloading MWRA glossary bundle from $BUNDLE_URL"
  tmp_zip="$(mktemp)"
  cleanup() {
    rm -f "$tmp_zip"
  }
  trap cleanup EXIT
  trap_cleanup=true

  curl --proto '=https' --tlsv1.2 -fL "$BUNDLE_URL" -o "$tmp_zip"

  if [[ -n "$SHA256_EXPECTED" ]]; then
    echo "Verifying SHA-256 of downloaded archive…"
    if command -v sha256sum >/dev/null 2>&1; then
      actual="$(sha256sum "$tmp_zip" | awk '{print $1}')"
    else
      actual="$(shasum -a 256 "$tmp_zip" | awk '{print $1}')"
    fi
    if [[ "${actual,,}" != "${SHA256_EXPECTED,,}" ]]; then
      echo "Checksum mismatch:
  expected: $SHA256_EXPECTED
  actual:   $actual" >&2
      exit 1
    fi
  fi

  rm -rf "$PATCH_DIR"
  mkdir -p "$PATCH_DIR"
  if unzip -Z1 "$tmp_zip" | grep -q -E '(^/)|(\.\.)'; then
    echo "Error: Archive contains invalid file paths (absolute or traversal)." >&2
    exit 1
  fi
  unzip -q "$tmp_zip" -d "$PATCH_DIR"
  chmod -R u+rwX,go-rwx "$PATCH_DIR" || true
else
  if [[ ! -d "$PATCH_DIR" ]]; then
    echo "Patch directory '$PATCH_DIR' not found. Pass the extracted bundle directory as the first argument or use --download." >&2
    exit 1
  fi
fi

if $trap_cleanup; then
  trap - EXIT
  cleanup || true
fi

if [[ -d "$PATCH_DIR/web" ]]; then
  BUNDLE_ROOT="$PATCH_DIR"
else
  shopt -s nullglob
  found=""
  for candidate in "$PATCH_DIR"/*; do
    if [[ -d "$candidate/web" ]]; then
      found="$candidate"
      break
    fi
  done
  shopt -u nullglob
  if [[ -n "$found" ]]; then
    BUNDLE_ROOT="$found"
  else
    echo "Bundle directory '$PATCH_DIR' is missing the 'web' directory." >&2
    exit 1
  fi
fi

mkdir -p web netlify/functions

files=(
  "web/glossary.json"
  "web/boot_glossary.js"
  "netlify/functions/ask.js"
  "netlify.toml"
  "README.md"
)

for rel in "${files[@]}"; do
  src="$BUNDLE_ROOT/$rel"
  if [[ ! -f "$src" ]]; then
    echo "Required file '$src' not found in bundle." >&2
    exit 1
  fi
  dest="$rel"
  dest_dir="$(dirname "$dest")"
  mkdir -p "$dest_dir"
  cp -f "$src" "$dest"

done

INDEX_FILE="web/index.html"
SCRIPT_TAG='<script src="boot_glossary.js"></script>'
if [[ -f "$INDEX_FILE" ]]; then
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

echo "Applying MWRA glossary bundle from $BUNDLE_ROOT"
echo "All files copied. Review changes with 'git status' before committing."
