#!/usr/bin/env bash
# eod_git_backup.sh — run from repo root to generate today's report
set -euo pipefail
OUTDIR="${1:-backups}"
shift || true
python3 "$(dirname "$0")/eod_commit_report.py" --output-dir "$OUTDIR" --html "$@"
echo "Backup report written to $OUTDIR"
