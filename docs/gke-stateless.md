# Deploying a Stateless Linux Application on Google Kubernetes Engine

This guide summarizes the key steps required to deploy a stateless Linux workload to Google Kubernetes Engine (GKE).

## Prerequisites

Before creating a Deployment you should:

1. Enable the Google Kubernetes Engine API in your Google Cloud project.
2. Install and initialize the Google Cloud CLI (`gcloud`). Update it regularly with `gcloud components update` and set a default region or zone via `gcloud config set compute/region REGION` or `gcloud config set compute/zone ZONE` to avoid location errors.
3. Build and push your container image to an accessible registry such as Artifact Registry.
4. (Optional) Complete the GKE quickstart if you are new to the product.

## Example Deployment Manifest

A minimal Deployment that runs three replicas of the `hello-app` container image looks like the following:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      run: my-app
  template:
    metadata:
      labels:
        run: my-app
    spec:
      containers:
      - name: hello-app
        image: us-docker.pkg.dev/google-samples/containers/gke/hello-app:1.0
```

* `spec.replicas` defines how many Pods should run.
* `spec.template.metadata.labels` sets Pod labels that the Deployment uses to manage Pods.
* `spec.template.spec` describes the Pod, including the container name and image.

## Creating the Deployment

Apply the manifest with `kubectl`:

```bash
kubectl apply -f deployment.yaml
```

Replace `deployment.yaml` with the path to your manifest. You can also supply a directory to create all manifests inside it: `kubectl apply -f manifests/`.

> **Note:** `kubectl apply` requires an active cluster context.

## Inspecting the Deployment

* View a summary of the Deployment:
  ```bash
  kubectl describe deployment my-app
  ```
* List Pods managed by the Deployment (using the Pod label):
  ```bash
  kubectl get pods -l run=my-app
  ```
* Inspect a specific Pod:
  ```bash
  kubectl describe pod POD_NAME
  ```
* Retrieve the live Deployment manifest:
  ```bash
  kubectl get deployment my-app -o yaml
  ```

## Updating the Deployment

Update the manifest and re-run `kubectl apply -f deployment.yaml` to change replicas, container images, resource requests, and more. You can also use `kubectl set` for targeted image or resource updates, or edit the live resource with `kubectl edit deployment my-app`.

## Rolling Back

Undo the most recent rollout:

```bash
kubectl rollout undo deployment my-app
```

Roll back to a specific revision:

```bash
kubectl rollout undo deployment my-app --to-revision=3
```

## Scaling

Adjust replicas manually:

```bash
kubectl scale deployment my-app --replicas 5
```

Consider configuring autoscaling for production workloads.

## Deleting the Deployment

Clean up resources when finished:

```bash
kubectl delete deployment my-app
```

This workflow lets you operate stateless applications that scale horizontally without maintaining persistent storage in the cluster.
