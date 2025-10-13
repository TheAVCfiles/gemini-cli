# Deploying Gemini CLI apps to Google Compute Engine (Regional MIG + Internal HTTP LB)

This guide documents the commands required to deploy the Gemini reference architecture on Google Cloud using:

- Regional managed instance groups (MIGs) for the frontend and retrieval services.
- Zonal instance templates that pull application code from GitHub via startup scripts.
- Regional internal HTTP(S) load balancing to route `/api/*` traffic to the retrieval tier.
- Health checks, firewall rules, and autoscaling tuned for production workloads.

> **Prerequisites**
>
> - `gcloud` CLI 456.0.0 or later.
> - A Google Cloud project with the Compute Engine and Cloud Logging APIs enabled.
> - A service account with permissions to pull from Artifact Registry/GitHub (if required), read from Secret Manager, and manage Compute Engine resources.
> - Startup scripts for each tier (for example `startup/frontend.sh` and `startup/retrieval.sh`) checked into your repository or uploaded to Cloud Storage.
>
> The commands below assume the repository root contains a `startup/` directory with the scripts referenced above.

## 1. Environment variables

The snippet uses the following environment variables. Adjust each to match your environment:

```bash
PROJECT_ID="starry-argon-463819-a2"
REGION="us-central1"
NETWORK="default"
SUBNET="default"
SERVICE_ACCOUNT="YOUR_SA@$PROJECT_ID.iam.gserviceaccount.com"
REPO_URL="https://github.com/TheAVCfiles/your-repo.git"
REPO_BRANCH="main"
```

The startup scripts rely on the `REPO_URL`, `REPO_BRANCH`, `APP_ENV`, and `CONTAINER_IMAGE` metadata keys to bootstrap the instance. Make sure the scripts can handle empty `CONTAINER_IMAGE` values when running directly from source.

## 2. Project configuration

Switch the active project before provisioning resources:

```bash
gcloud config set project "$PROJECT_ID"
```

## 3. Health checks

Create independent HTTP health checks for each service. The frontend responds on port 80 and the retrieval tier on port 8080:

```bash
gcloud compute health-checks create http hc-frontend \
  --port 80 \
  --request-path=/healthz

gcloud compute health-checks create http hc-retrieval \
  --port 8080 \
  --request-path=/healthz
```

Ensure your application exposes the `/healthz` endpoint on each tier, otherwise replace the `--request-path` argument with the appropriate path.

## 4. Instance templates

Define two instance templates—one per service. Both templates:

- Use Debian 12 as the base image.
- Run without external IP addresses (`--no-address`) inside the provided VPC.
- Inherit the `genai` and `allow-healthcheck` network tags to match the firewall rules below.
- Inject metadata consumed by the startup scripts (repository coordinates and environment values).

```bash
gcloud compute instance-templates create genai-app-frontend-tpl \
  --region="$REGION" \
  --machine-type=e2-standard-2 \
  --image-family=debian-12 --image-project=debian-cloud \
  --network="$NETWORK" --subnet="$SUBNET" --no-address \
  --tags=genai,allow-healthcheck \
  --scopes=https://www.googleapis.com/auth/cloud-platform \
  --service-account="$SERVICE_ACCOUNT" \
  --metadata=^:^key=REPO_URL,value=$REPO_URL:key=REPO_BRANCH,value=$REPO_BRANCH:key=APP_ENV,value=prod:key=CONTAINER_IMAGE,value= \
  --metadata-from-file=startup-script=./startup/frontend.sh

```

```bash
gcloud compute instance-templates create genai-app-retrieval-tpl \
  --region="$REGION" \
  --machine-type=e2-standard-2 \
  --image-family=debian-12 --image-project=debian-cloud \
  --network="$NETWORK" --subnet="$SUBNET" --no-address \
  --tags=genai,allow-healthcheck \
  --scopes=https://www.googleapis.com/auth/cloud-platform \
  --service-account="$SERVICE_ACCOUNT" \
  --metadata=^:^key=REPO_URL,value=$REPO_URL:key=REPO_BRANCH,value=$REPO_BRANCH:key=APP_ENV,value=prod:key=CONTAINER_IMAGE,value= \
  --metadata-from-file=startup-script=./startup/retrieval.sh
```

> **Tip:** The `^:^` syntax lets you provide multiple key/value pairs in a single `--metadata` flag without escaping commas.

## 5. Regional managed instance groups

Create regional MIGs and enable autoscaling. Start with a single replica on each tier:

```bash
gcloud compute instance-groups managed create genai-frontend-mig \
  --region="$REGION" --size=1 --template=genai-app-frontend-tpl

gcloud compute instance-groups managed create genai-retrieval-mig \
  --region="$REGION" --size=1 --template=genai-app-retrieval-tpl

# Autoscaling policies

gcloud compute instance-groups managed set-autoscaling genai-frontend-mig \
  --region="$REGION" --max-num-replicas=10 --min-num-replicas=1 --target-cpu-utilization=0.6

gcloud compute instance-groups managed set-autoscaling genai-retrieval-mig \
  --region="$REGION" --max-num-replicas=10 --min-num-replicas=1 --target-cpu-utilization=0.6
```

Tune the scaling thresholds to your workload. You can also configure per-instance health check grace periods if startup scripts take longer than the default 60 seconds.

## 6. Internal HTTP load balancer

Provision regional backend services that point to each MIG and create a URL map to route `/api/*` requests to the retrieval tier:

```bash
gcloud compute backend-services create bs-frontend \
  --protocol=HTTP \
  --health-checks=hc-frontend \
  --region="$REGION"

gcloud compute backend-services create bs-retrieval \
  --protocol=HTTP \
  --health-checks=hc-retrieval \
  --region="$REGION"

# Attach the MIGs

gcloud compute backend-services add-backend bs-frontend \
  --instance-group=genai-frontend-mig \
  --instance-group-region="$REGION" \
  --region="$REGION"

gcloud compute backend-services add-backend bs-retrieval \
  --instance-group=genai-retrieval-mig \
  --instance-group-region="$REGION" \
  --region="$REGION"

# URL map and proxy

gcloud compute url-maps create urlmap-genai \
  --default-service=bs-frontend \
  --region="$REGION"

gcloud compute url-maps add-path-matcher urlmap-genai \
  --path-matcher-name=api-matcher \
  --default-service=bs-frontend \
  --new-hosts="*" \
  --backend-service-path-rules="/api/*=bs-retrieval" \
  --region="$REGION"

gcloud compute target-http-proxies create proxy-genai \
  --url-map=urlmap-genai \
  --region="$REGION"
```

Finally, expose the load balancer via an internal forwarding rule on port 80:

```bash
gcloud compute forwarding-rules create ilb-genai-internal \
  --load-balancing-scheme=INTERNAL_MANAGED \
  --network="$NETWORK" \
  --subnet="$SUBNET" \
  --address=0.0.0.0 \
  --ports=80 \
  --target-http-proxy=proxy-genai \
  --region="$REGION"
```

> **Note:** Internal HTTP load balancers require clients in the same VPC/region. Update the forwarding-rule address to a reserved internal IP if you need a stable endpoint.

## 7. Firewall rules

Allow Google Cloud health checks and internal client traffic to reach the MIG instances:

```bash
gcloud compute firewall-rules create allow-hc \
  --network="$NETWORK" \
  --allow=tcp:80,tcp:8080 \
  --source-ranges=130.211.0.0/22,35.191.0.0/16 \
  --target-tags=allow-healthcheck

gcloud compute firewall-rules create allow-ilb-to-backend \
  --network="$NETWORK" \
  --allow=tcp:80,tcp:8080 \
  --source-ranges=10.0.0.0/8 \
  --target-tags=genai
```

The health check ranges are maintained by Google. If your organization restricts egress, ensure these CIDR blocks remain accessible.

## 8. Post-deployment validation

1. Wait for each MIG to report healthy instances.
2. Use `gcloud compute forwarding-rules describe ilb-genai-internal --region="$REGION"` to find the assigned internal IP.
3. From a VM in the same VPC, issue curl requests against `http://<internal-ip>/` and `http://<internal-ip>/api/...` to validate routing.
4. Confirm log entries in Cloud Logging and monitor autoscaling activity via Cloud Monitoring dashboards.

## 9. Cleanup

When you no longer need the environment, delete the resources in reverse order to avoid dangling dependencies:

```bash
gcloud compute forwarding-rules delete ilb-genai-internal --region="$REGION"
gcloud compute target-http-proxies delete proxy-genai --region="$REGION"
gcloud compute url-maps delete urlmap-genai --region="$REGION"
gcloud compute backend-services delete bs-frontend bs-retrieval --region="$REGION"
gcloud compute instance-groups managed delete genai-frontend-mig genai-retrieval-mig --region="$REGION"
gcloud compute instance-templates delete genai-app-frontend-tpl genai-app-retrieval-tpl
gcloud compute health-checks delete hc-frontend hc-retrieval
```

Remove any additional firewall rules, startup scripts, or service accounts that were created specifically for this deployment.

---

For broader deployment considerations (including Terraform automation and CI/CD integration), see the main [deployment guide](deployment.md).
