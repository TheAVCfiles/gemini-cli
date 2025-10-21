set -euo pipefail
BASE="codex/deploy-firebase-codex-project"
HEAD="codex/deploy-to-firebase-hosting"

[ -d .git ] || { echo "Not a git repo. cd into your repo first."; exit 1; }
git fetch origin --prune
git ls-remote --exit-code --heads origin "$BASE" >/dev/null || { echo "Missing remote branch: $BASE"; exit 1; }
git ls-remote --exit-code --heads origin "$HEAD" >/dev/null || { echo "Missing remote branch: $HEAD"; exit 1; }

STAMP=$(date +"%Y%m%d-%H%M%S")
git checkout -b "backup-$STAMP"
git push -u origin "backup-$STAMP" || true

# checkout base (compat with older git: use checkout if switch not available)
if git switch -C "$BASE" --track "origin/$BASE" 2>/dev/null; then :; else
  git checkout "$BASE" || git checkout -b "$BASE" "origin/$BASE"
fi
git pull --ff-only origin "$BASE"

set +e
git merge --no-ff "origin/$HEAD" -m "merge: $HEAD → $BASE"
MERGE_STATUS=$?
set -e

if [ $MERGE_STATUS -ne 0 ]; then
  echo "⚠️ Merge conflicts. Resolve, then:"
  echo "  git add -A && git commit"
  echo "  git push -u origin $BASE"
  exit 2
fi

git push -u origin "$BASE"
echo "✅ Merged $HEAD into $BASE and pushed."
