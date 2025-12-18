# Cosign Signing Instructions

1. Install cosign
2. Generate key: `cosign generate-key-pair`
3. base64 your cosign.key: `base64 -w0 cosign.key > cosign.key.b64` and add to GitHub secret COSIGN_KEY_B64
4. CI will decode and sign artifacts with `cosign sign-blob --key cosign.key artifact.tar.gz`
5. Verification: `cosign verify-blob --key cosign.pub --signature artifact.sig artifact.tar.gz`
