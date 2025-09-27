#!/bin/bash

# Single copy-paste bootstrap block to spin up a working Google Cloud project
# Based on the requirements from TheAVCfiles/gemini-cli repository
#
# Usage: ./gcp-setup.sh [PROJECT_NAME] [BILLING_ACCOUNT_ID]
# Example: ./gcp-setup.sh intuition-labs 01ABCD-234EFG-567HIJ

set -euo pipefail

PROJECT_NAME="${1:-intuition-labs}"
BILLING_ACCOUNT_ID="${2:-}"

echo "🚀 Google Cloud Project Bootstrap - Full Throttle Setup"
echo "======================================================="

# Get billing account if not provided
if [[ -z "$BILLING_ACCOUNT_ID" ]]; then
    echo "⚠️  You need your billing account ID. Find it at: https://console.cloud.google.com/billing"
    echo "📋 Available billing accounts:"
    gcloud beta billing accounts list --format="table(name,displayName)" 2>/dev/null || echo "   Run 'gcloud auth login' first"
    echo ""
    read -p "Enter your billing account ID: " BILLING_ACCOUNT_ID
fi

echo ""
echo "📋 Configuration:"
echo "   Project: $PROJECT_NAME"
echo "   Billing: $BILLING_ACCOUNT_ID"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Setup cancelled"
    exit 0
fi

echo ""
echo "🎯 Starting full-throttle setup..."

# 1) Auth & pick project name (replace "intuition-labs" if you want)
echo "1️⃣  Authentication & Project Creation..."
gcloud auth login
gcloud projects create "$PROJECT_NAME" --set-as-default || echo "   Project may already exist, continuing..."
gcloud config set project "$PROJECT_NAME"

# 2) Billing link (must have billing acct id ready)
echo "2️⃣  Linking billing account..."
gcloud beta billing projects link "$PROJECT_NAME" \
  --billing-account="$BILLING_ACCOUNT_ID"

# 3) Enable core APIs you'll actually use
echo "3️⃣  Enabling core APIs (this takes a few minutes)..."
gcloud services enable \
  compute.googleapis.com \
  artifactregistry.googleapis.com \
  aiplatform.googleapis.com \
  discoveryengine.googleapis.com \
  firestore.googleapis.com \
  run.googleapis.com

# 4) Create default service account + grant owner (quick + dirty)
echo "4️⃣  Creating service account with owner permissions..."
gcloud iam service-accounts create default-sa \
  --display-name="Default Service Account" || echo "   Service account may already exist, continuing..."
gcloud projects add-iam-policy-binding "$PROJECT_NAME" \
  --member="serviceAccount:default-sa@$PROJECT_NAME.iam.gserviceaccount.com" \
  --role="roles/owner"

# 5) Get creds locally (so Python / Node clients just work)
echo "5️⃣  Generating local credentials..."
[[ -f key.json ]] && mv key.json "key.json.backup.$(date +%s)"
gcloud iam service-accounts keys create key.json \
  --iam-account="default-sa@$PROJECT_NAME.iam.gserviceaccount.com"
export GOOGLE_APPLICATION_CREDENTIALS="$PWD/key.json"

echo ""
echo "✅ SUCCESS! Your Google Cloud project is ready!"
echo "================================================="
echo ""
echo "🎯 Project Details:"
echo "   • Fresh project: $PROJECT_NAME"
echo "   • Billing: Tied and active"
echo "   • APIs: Vertex AI + Discovery Engine + Firestore + Cloud Run enabled"
echo "   • Credentials: Local key.json ready for Python/Node scripts"
echo ""
echo "🔧 Current environment:"
echo "   export GOOGLE_APPLICATION_CREDENTIALS=$PWD/key.json"
echo "   export GOOGLE_CLOUD_PROJECT=$PROJECT_NAME"
echo "   export GOOGLE_CLOUD_LOCATION=us-central1"
echo ""
echo "💡 To make permanent, add to your shell profile:"
echo "   echo 'export GOOGLE_APPLICATION_CREDENTIALS=\"$PWD/key.json\"' >> ~/.bashrc"
echo "   echo 'export GOOGLE_CLOUD_PROJECT=\"$PROJECT_NAME\"' >> ~/.bashrc"
echo "   echo 'export GOOGLE_CLOUD_LOCATION=\"us-central1\"' >> ~/.bashrc"
echo "   source ~/.bashrc"
echo ""
echo "🚀 Ready to:"
echo "   • Run your Codex repo against Vertex AI"
echo "   • Import docs into Discovery Engine"
echo "   • Use any Python/Node script with Google Cloud APIs"
echo ""
echo "⚠️  Keep key.json secure - don't commit to git!"