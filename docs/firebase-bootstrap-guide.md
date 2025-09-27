# Firebase Bootstrap Deployment Guide

This guide captures the clean, top-down workflow for wiring a fresh Firebase project to the bootstrap used by the Gemini CLI demo stack. Follow the steps in order without deviation.

## 0. Open the control panels

Open the following tabs before you start so you can switch quickly between them:

- [Google Cloud Console](https://console.cloud.google.com/)
- [Firebase Console](https://console.firebase.google.com/)
- [Create GitHub repository](https://github.com/new)

## 1. Choose the billing project

1. In the Google Cloud Console top bar, click the project picker.
2. Select the project that contains your credits ("My First Project" is fine as long as you stay consistent).
3. Set cost guardrails: **Billing → Budgets & alerts** and create alerts at **$50**, **$250**, and **$1000**.

## 2. Shut down tutorial infrastructure

The tutorial spin-up usually leaves several `load-balanced-vms` resources running. Stop them so you do not burn credits.

1. Go to **Compute Engine → VM instances**.
2. Select every VM you do not need, click **Stop**, and delete if you are certain.
3. Clean supporting resources:
   - **Compute Engine → Instance groups** – delete tutorial managed instance groups.
   - **Network services → Load balancing** – delete tutorial load balancers.

## 3. Create the bootstrap repository

1. Visit [https://github.com/new](https://github.com/new) and create a repository named `intuition-labs-studio` (or another name you prefer). Public vs. private is your choice.
2. On your laptop or in Cloud Shell (launch via the `>_` icon in the Cloud Console), run:

   ```bash
   git clone https://github.com/<YOUR_GH_USERNAME>/intuition-labs-studio.git
   cd intuition-labs-studio
   ```

## 4. Add the bootstrap script

1. In the repo root, create `bootstrap.sh` (same directory that contains the `.git` folder).
2. Paste the full bootstrap script provided earlier (the script that sets up `apps/web`, `functions`, and shared packages).
3. Install prerequisites and execute the script:

   ```bash
   npm install -g firebase-tools
   firebase login
   bash bootstrap.sh
   ```

4. Confirm the repo now contains:

   ```
   apps/
     web/
   functions/
   packages/
   .firebaserc
   firebase.json
   bootstrap.sh
   ```

## 5. Point Firebase CLI at the project

From the repo root, run:

```bash
firebase projects:list      # copy the projectId
firebase use <YOUR_PROJECT_ID>
```

This updates `.firebaserc` to target the correct Firebase project.

## 6. First deploy

Deploy hosting and the default Cloud Function to verify the wiring (this only incurs pennies).

```bash
npm run deploy:hosting
npm run deploy:functions
```

- Confirm hosting in **Firebase Console → Hosting** (copy the live URL).
- Invoke the Cloud Function at `https://<REGION>-<PROJECT_ID>.cloudfunctions.net/helloWorld`.

## 7. (Optional) Deploy agent API to Cloud Run

If you prefer Cloud Run over Functions for the agent API:

```bash
gcloud config set project <YOUR_PROJECT_ID>
gcloud run deploy agent-api --source . --region=us-central1 --allow-unauthenticated --memory=1Gi --cpu=1
```

After deploying, add a Firebase Hosting rewrite so `/api/*` proxies to Cloud Run. (Ask for the snippet when ready.)

## 8. Day-to-day navigation map

- **Site deployments**: Firebase Console → Hosting → *View* for the live URL.
- **Functions**: Firebase Console → Functions → monitor logs and versions.
- **Database**: Firebase Console → Firestore Database → create in Native mode.
- **Storage**: Firebase Console → Storage.
- **Costs**: Google Cloud Console → Billing → Cost table/Credits.
- **Logs**: Google Cloud Console → Logging → Logs Explorer (filter by `cloudfunctions` or `run`).

## 9. Sanity checklist

Keep these checkpoints handy so you always know you are working in the right place:

- GitHub repo named `intuition-labs-studio` that houses the bootstrap.
- Repo root contains `bootstrap.sh`, `firebase.json`, and `.firebaserc`.
- Firebase Console shows Hosting live and Functions deployed.
- Cloud Console billing alerts are configured.
- Compute Engine has no stray tutorial VMs unless intentionally running.

## 10. Quick command recap

From the repo root, memorize the core commands:

```bash
firebase login
firebase use <YOUR_PROJECT_ID>

npm run deploy:hosting
npm run deploy:functions
```

This loop keeps every deployment in one repo, one project, and one deployment path.
