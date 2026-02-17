# Hexaflexagon strip generator

This utility script renders printable strips for a simple trihexaflexagon puzzle. It ships with two presets:

- **Found edition**: unlabeled triangles and minimal instructions.
- **Official edition**: triangles labeled with `S` (Surface), `C` (Cipher), and `E` (Echo) plus indices.

## Running the generator

The script depends on `reportlab`. Install it via `pip install reportlab` if it is not already available in your environment.

```bash
python scripts/hexaflex_strip.py --output /tmp/hexaflex
```

The command above writes two PDFs: `/tmp/hexaflex_found.pdf` and `/tmp/hexaflex_official.pdf`. You can also generate a single variant with custom headings:

```bash
python scripts/hexaflex_strip.py --mode official --title "Custom" --subtitle "Notes" --output /tmp/strip.pdf
```

### Options

- `--output` — Path to the output file or a base path for both PDFs. Defaults to `/mnt/data/hexaflex`.
- `--mode` — Choose `both` (default), `found`, or `official`.
- `--title` / `--subtitle` — Override the default headings when rendering a single variant.
