# Secrets & IP handling

- Never keep private keys in repo.
- Exports: GPG encrypt before sharing (`gpg -c file.zip`).
- Signing: cosign for build artifacts; ECDSA or KMS for deliverable signing.
- Key rotation policy: rotate every 6 months, maintain escrow in KMS.
