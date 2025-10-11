# GitHub Pages Publication Guide

The following checklist captures the steps required to publish the **Intuition Labs, Vol. 1** site to GitHub Pages when working outside of this container. This is a manual flow that mirrors the instructions supplied with the archive.

## 1. Create the repository

1. Sign in to GitHub and create a new public repository, for example `intuition-labs-vol1`.
2. Leave *Initialize this repository with a README* unchecked so the uploaded archive can supply the full tree.

## 2. Upload the site content

1. Open the repository in the browser and choose **Add file → Upload files**.
2. Drag and drop the extracted archive contents (or the `.zip` itself) into the upload area.
3. Commit the upload directly to the `main` branch.

## 3. Configure GitHub Pages

1. Navigate to **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Choose the `main` branch and the root (`/`) folder.
4. Click **Save**. GitHub Pages will publish the site at `https://<your-username>.github.io/intuition-labs-vol1/`.

## Optional polish

* **Custom domain** – Add a file named `CNAME` at the repository root containing the desired domain name, then configure your DNS to point the domain at `<your-username>.github.io` via a CNAME record.
* **Zenodo DOI badge** – Edit the README header to include the DOI `10.5281/zenodo.17282954` so the repository links back to the published record.

## 4. Verify deployment

1. Wait for the GitHub Pages workflow to finish (watch the **Actions** tab or the Pages status banner).
2. Visit the published URL to confirm the site renders as expected.
3. If using a custom domain, verify that the HTTPS certificate has provisioned and that the custom domain resolves correctly.

These steps can be repeated to publish additional volumes (Vol. 2, Vol. 3, etc.) by replacing the repository and URL names accordingly.
