#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <project-id> <gcs-bucket>" >&2
  exit 1
fi

PROJECT_ID="$1"
GCS_BUCKET="$2"
SERVICE_ACCOUNT_NAME="ritual-svc"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

info() {
  echo "[setup-gcp] $*"
}

run_or_skip() {
  local description="$1"
  shift
  info "${description}"
  if ! "$@"; then
    info "${description} skipped or already exists"
  fi
}

info "Setting active project to ${PROJECT_ID}"
gcloud config set project "${PROJECT_ID}" >/dev/null

info "Enabling required services"
REQUIRED_SERVICES=(
  run.googleapis.com
  pubsub.googleapis.com
  bigquery.googleapis.com
  storage.googleapis.com
  texttospeech.googleapis.com
  secretmanager.googleapis.com
  iam.googleapis.com
)

gcloud services enable "${REQUIRED_SERVICES[@]}"

run_or_skip "Creating GCS bucket gs://${GCS_BUCKET}" \
  gsutil mb -p "${PROJECT_ID}" -l us-central1 "gs://${GCS_BUCKET}"

run_or_skip "Creating Pub/Sub topic ritual-jobs" \
  gcloud pubsub topics create ritual-jobs --project "${PROJECT_ID}"

run_or_skip "Creating service account ${SERVICE_ACCOUNT_NAME}" \
  gcloud iam service-accounts create "${SERVICE_ACCOUNT_NAME}" \
    --display-name "Ritual service account" \
    --project "${PROJECT_ID}"

assign_role() {
  local role="$1"
  info "Granting ${role} to ${SERVICE_ACCOUNT_EMAIL}"
  gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member "serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role "${role}" >/dev/null
}

assign_role roles/run.admin
assign_role roles/pubsub.editor
assign_role roles/storage.admin
assign_role roles/bigquery.dataEditor

info "Setup complete"
