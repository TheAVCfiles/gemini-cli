#!/usr/bin/env bash
set -euo pipefail

print_usage() {
  cat <<'USAGE'
Usage: apply_mwra_patch.sh [OPTIONS] [PATCH_DIR]

Apply the MWRA glossary bundle to the repository.

Options:
  --archive <PATH|URL>  Use the provided archive instead of an existing directory.
  --sha256 <HEX>        Verify the downloaded archive against the expected SHA-256 hash.
  -h, --help            Show this help text and exit.

If PATCH_DIR is omitted, "_mwra_patch" is used. When --archive is supplied, the
bundle is extracted to a temporary directory before applying the files.
USAGE
}

die() {
  echo "Error: $*" >&2
  exit 1
}

ARCHIVE=""
EXPECTED_SHA=""
PATCH_DIR=""
PATCH_DIR_SET=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --archive)
      [[ $# -ge 2 ]] || die "--archive requires a path or URL"
      ARCHIVE="$2"
      shift 2
      ;;
    --sha256)
      [[ $# -ge 2 ]] || die "--sha256 requires a 64-character hexadecimal hash"
      EXPECTED_SHA="$2"
      shift 2
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    --)
      shift
      break
      ;;
    -*)
      die "Unknown option: $1"
      ;;
    *)
      if [[ -z "$PATCH_DIR" ]]; then
        PATCH_DIR="$1"
        PATCH_DIR_SET=true
      else
        die "Multiple patch directories provided"
      fi
      shift
      ;;
  esac
done

if [[ $# -gt 0 ]]; then
  if [[ -z "$PATCH_DIR" ]]; then
    PATCH_DIR="$1"
    PATCH_DIR_SET=true
    shift
  else
    die "Unexpected extra argument: $1"
  fi
fi

if [[ $# -gt 0 ]]; then
  die "Unexpected extra argument: $1"
fi

if [[ -n "$EXPECTED_SHA" ]]; then
  [[ "$EXPECTED_SHA" =~ ^[0-9a-fA-F]{64}$ ]] || die "--sha256 must be a 64-character hexadecimal string"
  EXPECTED_SHA="${EXPECTED_SHA,,}"
  [[ -n "$ARCHIVE" ]] || die "--sha256 requires --archive"
fi

if [[ -z "$PATCH_DIR" ]]; then
  PATCH_DIR="_mwra_patch"
fi

temp_root=""
cleanup() {
  if [[ -n "$temp_root" && -d "$temp_root" ]]; then
    rm -rf "$temp_root"
  fi
}
trap cleanup EXIT

PATCH_SOURCE="$PATCH_DIR"

if [[ -n "$ARCHIVE" ]]; then
  if $PATCH_DIR_SET; then
    die "Do not supply PATCH_DIR when using --archive"
  fi

  temp_root="$(mktemp -d)"
  archive_path="$ARCHIVE"

  if [[ "$ARCHIVE" =~ ^https?:// ]]; then
    [[ "$ARCHIVE" == https://* ]] || die "Only HTTPS URLs are supported for --archive"
    archive_path="$temp_root/bundle.zip"
    curl --proto '=https' --tlsv1.2 --fail --location --silent --show-error "$ARCHIVE" --output "$archive_path"
  else
    [[ -f "$ARCHIVE" ]] || die "Archive file '$ARCHIVE' not found"
  fi

  if [[ -n "$EXPECTED_SHA" ]]; then
    computed_sha="$(sha256sum "$archive_path" | awk '{print tolower($1)}')"
    if [[ "$computed_sha" != "$EXPECTED_SHA" ]]; then
      die "SHA-256 mismatch: expected $EXPECTED_SHA but got $computed_sha"
    fi
  fi

  extract_dir="$temp_root/extracted"
  mkdir -p "$extract_dir"

  python3 - "$archive_path" "$extract_dir" <<'PY'
import os
import shutil
import stat
import sys
import zipfile
from pathlib import Path, PurePosixPath

archive_path = Path(sys.argv[1])
destination = Path(sys.argv[2]).resolve()
dest_prefix = str(destination)
if not dest_prefix.endswith(os.sep):
    dest_prefix += os.sep

with zipfile.ZipFile(archive_path) as zf:
    for info in zf.infolist():
        name = info.filename
        if name.endswith('/'):
            name = name[:-1]
        if not name:
            continue

        pure_path = PurePosixPath(name)
        if pure_path.is_absolute():
            sys.stderr.write(f"Refusing to extract absolute path: {name}\n")
            raise SystemExit(1)
        if any(part in ('', '.', '..') for part in pure_path.parts):
            sys.stderr.write(f"Refusing to extract unsafe path: {name}\n")
            raise SystemExit(1)

        relative = Path(*pure_path.parts)
        target = (destination / relative).resolve()
        target_str = str(target)
        if target != destination and not target_str.startswith(dest_prefix):
            sys.stderr.write(f"Refusing to extract outside destination: {name}\n")
            raise SystemExit(1)

        file_type = info.external_attr >> 16
        if file_type and stat.S_ISLNK(file_type):
            sys.stderr.write(f"Refusing to extract symbolic link: {name}\n")
            raise SystemExit(1)
        if file_type and not (stat.S_ISREG(file_type) or stat.S_ISDIR(file_type)):
            sys.stderr.write(f"Refusing unsupported file type: {name}\n")
            raise SystemExit(1)

        if info.is_dir():
            target.mkdir(parents=True, exist_ok=True)
            continue

        target.parent.mkdir(parents=True, exist_ok=True)
        with zf.open(info) as source, open(target, 'wb') as dest_file:
            shutil.copyfileobj(source, dest_file)
PY

  if find "$extract_dir" -mindepth 1 -print -quit >/dev/null 2>&1; then
    find "$extract_dir" -type d -exec chmod 755 {} +
    find "$extract_dir" -type f -exec chmod 644 {} +
  fi

  mapfile -t top_level < <(find "$extract_dir" -mindepth 1 -maxdepth 1 -print)
  if [[ ${#top_level[@]} -eq 1 && -d "${top_level[0]}" ]]; then
    PATCH_SOURCE="${top_level[0]}"
  else
    PATCH_SOURCE="$extract_dir"
  fi
fi

if [[ ! -d "$PATCH_SOURCE" ]]; then
  die "Patch directory '$PATCH_SOURCE' not found. Pass the extracted bundle directory or use --archive."
fi

echo "Applying MWRA glossary bundle from $PATCH_SOURCE"

mkdir -p web netlify/functions

cp -f "$PATCH_SOURCE/web/glossary.json" web/glossary.json
cp -f "$PATCH_SOURCE/web/boot_glossary.js" web/boot_glossary.js
cp -f "$PATCH_SOURCE/netlify/functions/ask.js" netlify/functions/ask.js
cp -f "$PATCH_SOURCE/netlify.toml" netlify.toml
cp -f "$PATCH_SOURCE/README.md" README.md

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

echo "All files copied. Review changes with 'git status' before committing."
