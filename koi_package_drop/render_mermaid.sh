#!/usr/bin/env bash
# render_mermaid.sh — render Mermaid .mmd to PNG/SVG using Mermaid CLI.
# Requires Node.js. One-time setup:
#   npm install -g @mermaid-js/mermaid-cli
#
# Usage:
#   ./render_mermaid.sh input.mmd out.svg
#   ./render_mermaid.sh input.mmd out.png

set -euo pipefail
if [ "$#" -lt 2 ]; then
  echo "Usage: $0 input.mmd output.(svg|png)"
  exit 1
fi

in="$1"
out="$2"
mmdc -i "$in" -o "$out" --backgroundColor transparent
echo "Rendered $out"
