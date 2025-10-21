# MWRA Glossary Bundle Checklist

Use this list when applying the bundle in a downstream repository.

- [ ] Extract the archive into `_mwra_patch/` (or pass a different path to the script),
      or run `bash apply_mwra_patch.sh --download` to fetch the latest bundle automatically
      (optionally add `--sha256 <HEX>` to verify integrity).
- [ ] Run `bash apply_mwra_patch.sh` (optionally pass the extracted directory or combine with `--download`).
- [ ] Confirm `web/index.html` includes `<script src="boot_glossary.js"></script>` before `</body>`.
- [ ] Inspect `web/glossary.json` to verify the canonical dataset copied correctly.
- [ ] Deploy locally (`netlify dev`) and ensure:
  - [ ] Glossary entries load and search works.
  - [ ] Uploading a CSV/JSON produces conflict summaries.
  - [ ] The Ask dialog returns either a stub or live response.
- [ ] Commit the changes and push to trigger deployment (Netlify/Firebase/etc.).
