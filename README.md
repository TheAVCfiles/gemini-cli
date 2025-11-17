# Decrypt The Girl — Dev

**Modes:** Surface / Cipher / Echo  
**Key:** A5 unlocks B5b; Caesar(+3 on vowels) in margin glyphs; “repetition with deviation” marks true routes.

## Quickstart
```bash
npm i
npm run dev
```

Open http://localhost:5173 and press Unlock B5b to simulate a route change.

Codex Notes
•Model: gpt-5-codex, reasoning: high
•Use @web/decoder/decoder.html and @web/engine/decoder.js as references when editing.
•Keep PRs atomic by module: /decoder, /engine, /styles, /docs.

Structure

docs/
  Dossier/
  Decryption-Deck/
  Manuscript/
web/
  decoder/decoder.html
  engine/decoder.js
  styles/verseframe.css
assets/
  glyphs/
  images/
  fonts/

---

# .gitignore (root)

node_modules/
dist/
.vscode/.db
.env
.DS_Store

---

## One-time “ignite” commands
In the repo root (inside VS Code terminal):
```bash
npm i
npm run dev
# In the Run and Debug panel, choose: "Dev + Browser"
```

Codex wake phrase (inside the Codex side panel)

Paste:

Load mythos.config.json. Use gpt-5-codex with high reasoning. 
Adopt Surface/Cipher/Echo mental model. 
Index docs/Manuscript and web/**. 
Propose a PR to upgrade decoder.js: implement Caesar(+3 on vowels) helper and a keyboard router (1/2/3 → Surface/Cipher/Echo).

You now have a clean, professional activation scaffold: Codex sees your intent, your modes, and the exact files to touch—no flailing, just flow. Next natural move: ask Codex to implement the Caesar(+3 on vowels) helper and a minimal router in decoder.js, then request a diff before applying.
