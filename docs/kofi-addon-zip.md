# Ko-fi Add-on ZIP Recreation

This utility outlines how to rebuild the `KoFi_AutoPost_and_TierPresets_Addon.zip`
archive that is stored in the shared `/mnt/data` volume during integration tests.

## Python helper script

A helper script is available at `scripts/create_kofi_zip.py`. It mirrors the
manual reproduction steps and ensures the expected folder layout exists before
creating the ZIP.

```bash
python scripts/create_kofi_zip.py
```

By default this command:

- Ensures `/mnt/data/KoFi_AutoPost_and_TierPresets_Addon/public` and
  `/mnt/data/KoFi_AutoPost_and_TierPresets_Addon/functions` are present.
- Regenerates the `/mnt/data/KoFi_AutoPost_and_TierPresets_Addon.zip` archive.
- Prints a summary that includes the file count, archive size, SHA-256 hash, and
  the list of contained files.

You can override the source directory or output path:

```bash
python scripts/create_kofi_zip.py /custom/source --output /tmp/kofi.zip
```
