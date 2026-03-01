# DecryptTheGirl Release Manifest

This example captures the release manifest for the "DecryptTheGirl" project.
It outlines where builds should be published, where exported artifacts live,
and which credentials must be provided when automating releases.

## Manifest layout

- **Project name:** `DecryptTheGirl`
- **Publish targets:** `mythos_cloud` and `github_release`
- **Artifacts directory:** `./exports`
- **Manifest ledger:** `./proof_ledger.json`
- **Authentication:** expects `GITHUB_TOKEN` and `MYTHOS_API_KEY` secrets
- **Metadata:** Authored by Allison Van Cura under the CC-BY-NC-4.0 license
  with thematic tags for adaptive ethics, sentient cents, and balanchine cipher
  references.

The canonical YAML manifest lives alongside this document at
[`decrypt-the-girl-manifest.yaml`](./decrypt-the-girl-manifest.yaml).

## Related data bundle

The MWRA glossary bundle continues to be published to the Gemini-hosted vector
store and can be retrieved from:

<https://platform.openai.com/storage/vector_stores/vs_6859e43920848191a894dd36ecf0595a>

Use the `apply_mwra_patch.sh` helper when you need to sync the glossary assets
into a fresh checkout.
