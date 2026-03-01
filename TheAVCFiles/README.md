# The AVC Files

A lightweight snapshot of Allison Van Cura's codex scaffolding. The layout mirrors the working folders used for the Decrypt corpus so each strand (codex entries, engine logic, ebook builds, and web UI) has a predictable home. Only the codex layer carries content in this snapshot; the other directories are stubbed for future synchronization.

## Directory map

```
TheAVCFiles/
├── codex/             # Narrative building blocks (poems, scenes, constellations, glyphs, etc.)
├── engine/            # Reader + API + schema logic (stubs)
├── ebook/             # EPUB/Twine/PDF build outputs (stubs)
└── web/               # Frontend shell for presenting the codex (stubs)
```

## Current codex entries

- `codex/index.json` advertises the relative paths for the codex modules.
- `codex/modes/Echo.json` records the Echo mode definition.
- `codex/constellations/BroadcastBreak.json` defines the Broadcast Break constellation and now includes the poem `aurora_04_break` in its node list.
- `codex/poems/aurora_04_break.json` is a fresh poem entry (alignment: Pisces / The Moon / Glyph-03) with ties to Aurora, Static, and the Broadcast Break thread.

## Extending the codex

- Add new entries under `codex/poems/`, `codex/scenes/`, or other subfolders and keep the `id` stable.
- Update constellation files when adding or removing node IDs so navigation stays coherent.
- Use the `relations` block inside poems to link mirrors, unlocks, and glitches between pieces.
- Keep non-codex directories populated with stubs or exports to preserve the working layout.
