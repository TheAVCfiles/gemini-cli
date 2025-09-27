# Google Cloud Project Setup Guide

This repository provides two bootstrap scripts to quickly set up a Google Cloud project for use with Gemini CLI and related AI services.

## Prerequisites

1. **Google Cloud CLI installed**: [Installation guide](https://cloud.google.com/sdk/docs/install)
2. **Google Cloud billing account**: Set up at [console.cloud.google.com/billing](https://console.cloud.google.com/billing)
3. **Appropriate permissions**: Ability to create projects and manage billing

## Quick Setup (Recommended)

The `gcp-setup.sh` script provides a streamlined, full-throttle setup process:

```bash
./gcp-setup.sh [PROJECT_NAME] [BILLING_ACCOUNT_ID]
```

### Examples:
```bash
# Interactive setup (prompts for billing account)
./gcp-setup.sh

# With custom project name
./gcp-setup.sh my-ai-project

# Fully automated
./gcp-setup.sh my-ai-project 01ABCD-234EFG-567HIJ
```

### What it does:
1. **Authentication**: Logs you into Google Cloud
2. **Project Creation**: Creates fresh project with your chosen name (default: `intuition-labs`)
3. **Billing Setup**: Links your billing account automatically
4. **API Enablement**: Enables core APIs:
   - Compute Engine API
   - Artifact Registry API
   - Vertex AI API
   - Discovery Engine API
   - Firestore API
   - Cloud Run API
5. **Service Account**: Creates `default-sa` with owner permissions
6. **Local Credentials**: Generates `key.json` and sets environment variables

## Advanced Setup

The `gcp-bootstrap.sh` script provides an interactive setup with detailed progress reporting:

```bash
./gcp-bootstrap.sh [PROJECT_NAME]
```

### Features:
- ✅ Input validation and error handling
- ✅ Colored progress output
- ✅ Automatic billing account detection
- ✅ Safe handling of existing resources
- ✅ Detailed completion summary
- ✅ Help documentation (`--help`)

## Post-Setup

After running either script, you'll have:

### Environment Variables (automatically set for current session):
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"
export GOOGLE_CLOUD_PROJECT="your-project-name"
export GOOGLE_CLOUD_LOCATION="us-central1"
```

### Making Environment Variables Permanent:
```bash
echo 'export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"' >> ~/.bashrc
echo 'export GOOGLE_CLOUD_PROJECT="your-project-name"' >> ~/.bashrc
echo 'export GOOGLE_CLOUD_LOCATION="us-central1"' >> ~/.bashrc
source ~/.bashrc
```

### Ready to Use:
- **Gemini CLI**: All authentication configured
- **Vertex AI**: Ready for AI model inference
- **Discovery Engine**: Ready for document import and search
- **Python/Node scripts**: `key.json` works automatically with Google Cloud client libraries

## Security Notes

⚠️ **Important**: The generated `key.json` file contains sensitive credentials:
- Keep it secure and never commit to version control
- The `.gitignore` already excludes it: `.gcp/credentials.json`
- Consider using Application Default Credentials (ADC) for production

## Troubleshooting

### Common Issues:

1. **"gcloud not found"**: Install Google Cloud CLI first
2. **"No billing accounts"**: Set up billing at console.cloud.google.com/billing
3. **"Project already exists"**: Scripts handle this gracefully, will use existing project
4. **API enablement timeout**: Large projects may take 5-10 minutes for all APIs

### Getting Help:

```bash
# Show help for advanced script
./gcp-bootstrap.sh --help

# Check your current configuration
gcloud config list

# Verify APIs are enabled
gcloud services list --enabled
```

## Integration with Gemini CLI

These scripts are designed to work seamlessly with the Gemini CLI authentication patterns documented in:
- [`docs/cli/authentication.md`](../cli/authentication.md)
- [`docs/cli/configuration.md`](../cli/configuration.md)

The generated credentials work with all supported authentication methods:
- Application Default Credentials (ADC)
- Service Account JSON keys
- Environment variable configuration