# Export Signed Snapshot (client instructions)

1. In the dashboard: Project -> Export -> Signed Snapshot
2. The browser will create a `.enc` file.
3. To share: symmetrically encrypt with `gpg -c` or sign with your private key:
- `gpg -c project.enc` (choose passphrase)
- Or sign: `openssl dgst -sha256 -sign key.pem -out project.sig project.enc`
