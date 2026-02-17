#!/bin/bash

# Google Cloud Project Bootstrap Script
# This script sets up a complete Google Cloud project for use with Gemini CLI
# Based on the requirements from: TheAVCfiles/gemini-cli repository

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default project name (can be overridden)
DEFAULT_PROJECT_NAME="intuition-labs"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if gcloud is installed
check_gcloud() {
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI is not installed. Please install it first:"
        echo "  https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    print_success "gcloud CLI is installed"
}

# Function to get billing account
get_billing_account() {
    print_status "Fetching available billing accounts..."
    
    # Check if user has any billing accounts
    billing_accounts=$(gcloud beta billing accounts list --format="value(name)" 2>/dev/null || echo "")
    
    if [[ -z "$billing_accounts" ]]; then
        print_error "No billing accounts found. Please set up a billing account first:"
        echo "  https://console.cloud.google.com/billing"
        exit 1
    fi
    
    # If only one billing account, use it automatically
    account_count=$(echo "$billing_accounts" | wc -l)
    if [[ $account_count -eq 1 ]]; then
        BILLING_ACCOUNT_ID=$(echo "$billing_accounts" | head -1)
        print_success "Using billing account: $BILLING_ACCOUNT_ID"
    else
        # Multiple accounts, let user choose
        print_status "Multiple billing accounts found:"
        gcloud beta billing accounts list
        echo
        read -p "Enter your billing account ID: " BILLING_ACCOUNT_ID
    fi
}

# Function to setup the project
setup_project() {
    local project_name="$1"
    
    print_status "Setting up Google Cloud project: $project_name"
    
    # 1) Auth & pick project name
    print_status "Step 1/5: Authentication and project creation"
    
    # Check if already authenticated
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        print_status "Logging in to Google Cloud..."
        gcloud auth login
    else
        print_success "Already authenticated with Google Cloud"
    fi
    
    # Create project (skip if it already exists)
    if gcloud projects describe "$project_name" &>/dev/null; then
        print_warning "Project $project_name already exists, using existing project"
    else
        print_status "Creating project $project_name..."
        gcloud projects create "$project_name" --set-as-default
        print_success "Project $project_name created"
    fi
    
    gcloud config set project "$project_name"
    print_success "Active project set to $project_name"
    
    # 2) Billing link
    print_status "Step 2/5: Linking billing account"
    get_billing_account
    
    gcloud beta billing projects link "$project_name" \
        --billing-account="$BILLING_ACCOUNT_ID"
    print_success "Billing account linked to project"
    
    # 3) Enable core APIs
    print_status "Step 3/5: Enabling APIs"
    print_status "This may take a few minutes..."
    
    apis=(
        "compute.googleapis.com"
        "artifactregistry.googleapis.com"
        "aiplatform.googleapis.com"
        "discoveryengine.googleapis.com"
        "firestore.googleapis.com"
        "run.googleapis.com"
    )
    
    for api in "${apis[@]}"; do
        print_status "Enabling $api..."
        gcloud services enable "$api"
    done
    print_success "All APIs enabled successfully"
    
    # 4) Create default service account
    print_status "Step 4/5: Creating service account"
    
    sa_name="default-sa"
    sa_email="$sa_name@$project_name.iam.gserviceaccount.com"
    
    # Check if service account already exists
    if gcloud iam service-accounts describe "$sa_email" &>/dev/null; then
        print_warning "Service account $sa_email already exists"
    else
        gcloud iam service-accounts create "$sa_name" \
            --display-name="Default Service Account"
        print_success "Service account created: $sa_email"
    fi
    
    # Grant owner role
    gcloud projects add-iam-policy-binding "$project_name" \
        --member="serviceAccount:$sa_email" \
        --role="roles/owner"
    print_success "Owner role granted to service account"
    
    # 5) Generate and configure credentials
    print_status "Step 5/5: Setting up local credentials"
    
    key_file="key.json"
    if [[ -f "$key_file" ]]; then
        print_warning "Key file $key_file already exists. Creating backup..."
        mv "$key_file" "$key_file.backup.$(date +%s)"
    fi
    
    gcloud iam service-accounts keys create "$key_file" \
        --iam-account="$sa_email"
    print_success "Service account key created: $key_file"
    
    # Set environment variable for current session
    export GOOGLE_APPLICATION_CREDENTIALS="$PWD/$key_file"
    export GOOGLE_CLOUD_PROJECT="$project_name"
    export GOOGLE_CLOUD_LOCATION="us-central1"  # Default location
    
    print_success "Environment variables set for current session"
}

# Function to display final instructions
show_completion_message() {
    local project_name="$1"
    
    echo
    print_success "🎉 Google Cloud project setup complete!"
    echo
    echo -e "${GREEN}Project Details:${NC}"
    echo "  • Project ID: $project_name"
    echo "  • Service Account: default-sa@$project_name.iam.gserviceaccount.com"
    echo "  • Credentials: $PWD/key.json"
    echo
    echo -e "${GREEN}Enabled APIs:${NC}"
    echo "  • Compute Engine API"
    echo "  • Artifact Registry API"
    echo "  • Vertex AI API"
    echo "  • Discovery Engine API"
    echo "  • Firestore API"
    echo "  • Cloud Run API"
    echo
    echo -e "${GREEN}Environment Variables (set for current session):${NC}"
    echo "  export GOOGLE_APPLICATION_CREDENTIALS=\"$PWD/key.json\""
    echo "  export GOOGLE_CLOUD_PROJECT=\"$project_name\""
    echo "  export GOOGLE_CLOUD_LOCATION=\"us-central1\""
    echo
    echo -e "${YELLOW}To make these permanent, add them to your shell profile:${NC}"
    echo "  echo 'export GOOGLE_APPLICATION_CREDENTIALS=\"$PWD/key.json\"' >> ~/.bashrc"
    echo "  echo 'export GOOGLE_CLOUD_PROJECT=\"$project_name\"' >> ~/.bashrc"
    echo "  echo 'export GOOGLE_CLOUD_LOCATION=\"us-central1\"' >> ~/.bashrc"
    echo "  source ~/.bashrc"
    echo
    echo -e "${GREEN}Next Steps:${NC}"
    echo "  • Your project is ready for Gemini CLI, Vertex AI, and Discovery Engine"
    echo "  • Run 'gcloud config list' to verify your configuration"
    echo "  • Visit Google Cloud Console: https://console.cloud.google.com"
    echo
    print_warning "Keep your key.json file secure and do not commit it to version control!"
}

# Main function
main() {
    local project_name="${1:-$DEFAULT_PROJECT_NAME}"
    
    echo "=============================================="
    echo "  Google Cloud Project Bootstrap Script"
    echo "=============================================="
    echo
    
    # Validate project name
    if [[ ! "$project_name" =~ ^[a-z][a-z0-9-]{4,28}[a-z0-9]$ ]]; then
        print_error "Invalid project name. Project names must:"
        echo "  • Be 6-30 characters long"
        echo "  • Start with a lowercase letter"
        echo "  • Contain only lowercase letters, numbers, and hyphens"
        echo "  • End with a letter or number"
        echo
        echo "Example: intuition-labs, my-ai-project-2024"
        exit 1
    fi
    
    print_status "Setting up project: $project_name"
    
    # Check prerequisites
    check_gcloud
    
    # Confirm before proceeding
    echo
    read -p "Continue with project setup? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Setup cancelled by user"
        exit 0
    fi
    
    # Run setup
    setup_project "$project_name"
    
    # Show completion message
    show_completion_message "$project_name"
}

# Show help if requested
if [[ "${1:-}" == "--help" ]] || [[ "${1:-}" == "-h" ]]; then
    echo "Google Cloud Project Bootstrap Script"
    echo
    echo "Usage: $0 [PROJECT_NAME]"
    echo
    echo "This script creates a complete Google Cloud project setup for Gemini CLI:"
    echo "  • Creates or uses existing project"
    echo "  • Links billing account"
    echo "  • Enables required APIs (Vertex AI, Discovery Engine, etc.)"
    echo "  • Creates service account with owner permissions"
    echo "  • Generates and configures local credentials"
    echo
    echo "Arguments:"
    echo "  PROJECT_NAME    Name for the Google Cloud project (default: intuition-labs)"
    echo
    echo "Examples:"
    echo "  $0                    # Uses default project name 'intuition-labs'"
    echo "  $0 my-ai-project     # Creates project 'my-ai-project'"
    echo
    echo "Requirements:"
    echo "  • gcloud CLI installed and available in PATH"
    echo "  • Active Google Cloud billing account"
    echo "  • Appropriate permissions to create projects"
    exit 0
fi

# Run main function with all arguments
main "$@"