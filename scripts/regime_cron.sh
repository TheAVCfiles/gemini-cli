#!/usr/bin/env bash
set -euo pipefail

# ---- config ----
BASE_DIR="/opt/avc"
VENV_DIR="${BASE_DIR}/venv"               # if you use one; otherwise drop the source line
DATA_DIR="${BASE_DIR}/data"               # where your CSVs live
OUT_DIR="${BASE_DIR}/out"                 # where the live runner reads from
STAMP="$(date -u +'%Y%m%dT%H%M%SZ')"

TAU_SUMMARY="${DATA_DIR}/tau_star_summary.csv"
EVENT_PERM="${DATA_DIR}/event_study_permutation_summary.csv"
OVERLAY="${DATA_DIR}/backtest_overlay_results.csv"

REGIME_JSON_TMP="${OUT_DIR}/.daily_overlay_regime.json.${STAMP}.tmp"
REGIME_JSON="${OUT_DIR}/daily_overlay_regime.json"

LEVELS_IN="${DATA_DIR}/levels_input.csv"
LEVELS_OUT_TMP="${OUT_DIR}/.predictive_levels.csv.${STAMP}.tmp"
LEVELS_OUT="${OUT_DIR}/predictive_levels.csv"

LOG="${OUT_DIR}/regime_cron_${STAMP}.log"

# ---- env ----
mkdir -p "${OUT_DIR}"
exec > >(tee -a "${LOG}") 2>&1
echo "[${STAMP}] START regime_cron"

# ---- optional venv ----
if [[ -d "${VENV_DIR}" ]]; then
  # shellcheck disable=SC1091
  source "${VENV_DIR}/bin/activate"
fi

# ---- generate regime JSON (atomic) ----
python "${BASE_DIR}/regime_writer.py" \
  --tau-summary "${TAU_SUMMARY}" \
  --event-perm  "${EVENT_PERM}" \
  --overlay     "${OVERLAY}" \
  --out         "${REGIME_JSON_TMP}" \
  --fallback-weight 92

# ---- generate predictable levels (atomic) ----
python "${BASE_DIR}/levels_generator.py"  # reads levels_input.csv and writes predictive_levels.csv
# If your levels script *writes in place*, replace it with:
# python "${BASE_DIR}/levels_generator.py"
# mv "${OUT_DIR}/predictive_levels.csv" "${LEVELS_OUT_TMP}"

# Or if your generator expects explicit IO, do:
# python "${BASE_DIR}/levels_generator.py" --in "${LEVELS_IN}" --out "${LEVELS_OUT_TMP}"

# If you used TMPs, atomically swap into place:
[[ -f "${REGIME_JSON_TMP}" ]] && mv -f "${REGIME_JSON_TMP}" "${REGIME_JSON}"
[[ -f "${LEVELS_OUT_TMP}"  ]] && mv -f "${LEVELS_OUT_TMP}"  "${LEVELS_OUT}"

# ---- fsync fence (best-effort) ----
sync

echo "[${STAMP}] DONE regime_cron"
