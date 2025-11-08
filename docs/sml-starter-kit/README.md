# SML Starter Kit v0.1

The SML Starter Kit bundles:

- the v0.1 language spec (`sourcery_alpha_spec.md`)
- three ready-to-run spell examples (`examples/*.sml`)
- a TypeScript CLI parser (`gemini sml`) that emits JSON events
- an optional Tkinter renderer (`packages/cli/src/resources/sml_renderer.py`)

## Quick start

```bash
npm install
npm run build
./bin/gemini sml docs/sml-starter-kit/examples/bloom_in_quiet.sml
```

To parse an entire directory and pretty-print the JSON output:

```bash
./bin/gemini sml docs/sml-starter-kit/examples --pretty
```

## Rendering with Tkinter

The CLI can pipe parsed events into a tiny Tkinter stage (requires Python 3 with Tk):

```bash
./bin/gemini sml docs/sml-starter-kit/examples --render
```

Use `--python` to point at a specific Python interpreter if needed.

## Files

- `sourcery_alpha_spec.md` — authoritative language reference
- `examples/*.sml` — sample spells demonstrating console and visual flows
- `packages/cli/src/utils/sml/parseSml.ts` — zero-dependency parser
- `packages/cli/src/resources/sml_renderer.py` — minimal renderer that fades in `display(...)` effects

Feel free to extend the parser with new effect handlers or integrate the emitted JSON events into your own engines.
