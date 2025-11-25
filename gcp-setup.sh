#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: ./gcp-setup.sh [options] [PROJECT_ID] [BILLING_ACCOUNT_ID]

Quickly bootstrap a Google Cloud project for Vertex AI / Gemini CLI usage.

Options:
  -l, --location <region>   Vertex AI location to configure (default: us-central1)
  --ci                      Non-interactive mode. Fails if input is missing.
  -h, --help                Show this help message and exit.

Positional arguments override environment variables PROJECT_ID and BILLING_ACCOUNT_ID.
Without arguments the script runs interactively.
USAGE
}

log() {
  local level="$1"; shift
  printf '[%s] %s\n' "$level" "$*"
}

error() {
  log 'ERROR' "$*" >&2
}

require_command() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    error "Missing required command: $cmd"
    error "Install the Google Cloud CLI: https://cloud.google.com/sdk/docs/install"
    exit 1
  fi
}

ACTIVE_ACCOUNT=""
ensure_gcloud_auth() {
  ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format='value(account)' 2>/dev/null || true)
  if [[ -z "$ACTIVE_ACCOUNT" ]]; then
    error "No active gcloud account detected. Run 'gcloud auth login' first."
    exit 1
  fi
}

project_exists() {
  local project_id="$1"
  gcloud projects describe "$project_id" >/dev/null 2>&1
}

link_billing() {
  local project_id="$1"
  local billing_account="$2"
  if [[ -z "$billing_account" ]]; then
    return 0
  fi

  local billing_enabled
  billing_enabled=$(gcloud beta billing projects describe "$project_id" \
    --format='value(billingEnabled)' 2>/dev/null || echo "false")
  if [[ "$billing_enabled" == "true" ]]; then
    log INFO "Billing already linked to project $project_id."
    return 0
  fi

  log INFO "Linking billing account $billing_account to $project_id..."
  gcloud beta billing projects link "$project_id" --billing-account "$billing_account"
}

ensure_services() {
  local project_id="$1"
  shift
  local services=("$@")
  log INFO "Enabling required services (${services[*]})..."
  gcloud services enable --project "$project_id" "${services[@]}"
}

update_env_file() {
  local project_id="$1"
  local location="$2"

  local env_dir=".gemini"
  local env_file="$env_dir/.env"
  mkdir -p "$env_dir"

  python3 <<PY
import pathlib

env_path = pathlib.Path('$env_file')
env_path.parent.mkdir(parents=True, exist_ok=True)

updates = {
    'GOOGLE_GENAI_USE_VERTEXAI': 'true',
    'GOOGLE_CLOUD_PROJECT': '$project_id',
    'GOOGLE_CLOUD_LOCATION': '$location',
}

lines = []
if env_path.exists():
    lines = env_path.read_text().splitlines()

result = []
seen = set()
for line in lines:
    if '=' in line:
        key = line.split('=', 1)[0].strip()
        if key in updates:
            result.append(f"{key}=\"{updates[key]}\"")
            seen.add(key)
            continue
    result.append(line)

for key, value in updates.items():
    if key not in seen:
        result.append(f"{key}=\"{value}\"")

text = "\n".join(result)
if text:
    text += "\n"

env_path.write_text(text)
PY

  log INFO "Updated $env_file with Vertex AI settings."
}

prompt() {
  local message="$1"
  local default_value="$2"
  local response
  read -r -p "$message" response
  if [[ -z "$response" ]]; then
    echo "$default_value"
  else
    echo "$response"
  fi
}

validate_project_id() {
  [[ "$1" =~ ^[a-z][a-z0-9-]{4,28}[a-z0-9]$ ]]
}

main() {
  require_command gcloud
  require_command python3

  local location="${GOOGLE_CLOUD_LOCATION:-us-central1}"
  local ci_mode=0

  local args=()
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -l|--location)
        if [[ $# -lt 2 ]]; then
          error "Missing value for $1"
          exit 1
        fi
        location="$2"
        shift 2
        ;;
      --ci)
        ci_mode=1
        shift
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      --)
        shift
        break
        ;;
      -*)
        error "Unknown option: $1"
        usage
        exit 1
        ;;
      *)
        args+=("$1")
        shift
        ;;
    esac
  done

  if [[ $# -gt 0 ]]; then
    args+=("$@")
  fi

  local project_id="${PROJECT_ID:-}"
  local billing_account="${BILLING_ACCOUNT_ID:-${BILLING_ACCOUNT:-}}"

  if [[ ${#args[@]} -ge 1 ]]; then
    project_id="${args[0]}"
  fi
  if [[ ${#args[@]} -ge 2 ]]; then
    billing_account="${args[1]}"
  fi

  if [[ -z "$project_id" ]]; then
    if [[ "$ci_mode" -eq 1 ]]; then
      error "PROJECT_ID is required in CI mode."
      exit 1
    fi
    local suggested="gemini-cli-$(whoami | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9' | cut -c1-12)-$(date +%y%m%d)"
    project_id=$(prompt "Google Cloud project ID [$suggested]: " "$suggested")
  fi

  if ! validate_project_id "$project_id"; then
    error "Invalid project ID '$project_id'. Must match ^[a-z][a-z0-9-]{4,28}[a-z0-9]$."
    exit 1
  fi

  if [[ -z "$billing_account" && "$ci_mode" -eq 0 ]]; then
    billing_account=$(prompt "Billing account ID (leave blank to skip): " "")
  fi

  ensure_gcloud_auth

  if project_exists "$project_id"; then
    log INFO "Project $project_id already exists."
  else
    log INFO "Creating project $project_id..."
    gcloud projects create "$project_id"
  fi

  log INFO "Setting active project to $project_id..."
  gcloud config set project "$project_id" >/dev/null

  link_billing "$project_id" "$billing_account"

  ensure_services "$project_id" \
    serviceusage.googleapis.com \
    cloudresourcemanager.googleapis.com \
    iam.googleapis.com \
    iamcredentials.googleapis.com \
    aiplatform.googleapis.com

  log INFO "Configuring Vertex AI location: $location"
  gcloud config set ai/location "$location" >/dev/null || true

  update_env_file "$project_id" "$location"

  local adc_ok=0
  if gcloud auth application-default print-access-token >/dev/null 2>&1; then
    adc_ok=1
  fi

  local billing_status="no"
  local billing_state
  billing_state=$(gcloud beta billing projects describe "$project_id" --format='value(billingEnabled)' 2>/dev/null || echo "false")
  if [[ "$billing_state" == "true" ]]; then
    billing_status="yes"
    if [[ -n "$billing_account" ]]; then
      billing_status+=" ($billing_account)"
    fi
  elif [[ -n "$billing_account" ]]; then
    billing_status="requested ($billing_account)"
  fi

  cat <<SUMMARY

✅ Google Cloud bootstrap complete.
- Active account: $ACTIVE_ACCOUNT
- Project ID: $project_id
- Location: $location
- Billing linked: $billing_status
- ADC present: $([[ $adc_ok -eq 1 ]] && echo yes || echo no)

Next steps:
- If ADC shows "no", run: gcloud auth application-default login
- Export variables or restart your shell so ~/.gemini/.env is reloaded
- To verify access, try: gcloud services list --enabled | grep aiplatform
SUMMARY
}

main "$@"
