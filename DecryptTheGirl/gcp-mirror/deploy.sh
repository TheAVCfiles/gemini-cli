#!/usr/bin/env bash
set -euo pipefail

CONFIG_FILE="config.yaml"

if ! command -v yq >/dev/null 2>&1; then
  echo "yq is required. Install it from https://github.com/mikefarah/yq" >&2
  exit 1
fi

if [[ ! -f "${CONFIG_FILE}" ]]; then
  echo "Missing ${CONFIG_FILE}. Copy sample-config.yaml and update project settings." >&2
  exit 1
fi

PROJECT_ID=$(yq '.project_id' "${CONFIG_FILE}")
REGION=$(yq '.region' "${CONFIG_FILE}")
SERVICE_NAME=$(yq '.service_name' "${CONFIG_FILE}")

if [[ -z "${PROJECT_ID}" || -z "${REGION}" || -z "${SERVICE_NAME}" ]]; then
  echo "project_id, region, and service_name must be defined in ${CONFIG_FILE}." >&2
  exit 1
fi

echo "Using project: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo "Service: ${SERVICE_NAME}"

gcloud config set project "${PROJECT_ID}"

gcloud builds submit --tag "gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest" .

gcloud run deploy "${SERVICE_NAME}" \
  --image "gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "FOLIO_PROJECT=${PROJECT_ID}"

echo "Deployment complete. Visit the Cloud Run service URL above to access folio metadata."
