set -euo pipefail

# 1) Archive old stuff (keeps history; moves files not in .keep list)
mkdir -p _archive
keep=(".git" "." ".." "_archive" "bootstrap.sh")
for f in * .*; do
  skip=0
  for k in "${keep[@]}"; do [[ "$f" == "$k" ]] && skip=1; done
  [[ $skip -eq 1 ]] && continue
  [[ "$f" == "_archive" ]] && continue
  mv "$f" "_archive/" 2>/dev/null || true
done

# 2) Monorepo skeleton
mkdir -p apps/web/public apps/web/src packages/agent .gcp .github/workflows infra/firebase functions .vscode

# 3) Node toolchain
cat > package.json <<'JSON'
{
  "name": "theavcfiles-codex",
  "private": true,
  "workspaces": ["apps/*","packages/*"],
  "scripts": {
    "setup": "npm run install-all && npm run prepare",
    "install-all": "npm install",
    "dev": "npm --workspace apps/web run dev",
    "build": "npm --workspace apps/web run build",
    "lint": "eslint .",
    "format": "prettier -w .",
    "test": "vitest run",
    "agent": "node packages/agent/run.js",
    "deploy": "firebase deploy --non-interactive"
  },
  "devDependencies": {
    "eslint": "^9.13.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-import": "^2.31.0",
    "prettier": "^3.3.3",
    "typescript": "^5.6.3",
    "vitest": "^2.1.3"
  }
}
JSON

# 4) tsconfig, eslint, prettier
cat > tsconfig.json <<'JSON'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  },
  "include": ["apps","packages"]
}
JSON

cat > .eslintrc.cjs <<'CJS'
module.exports = {
  root: true,
  env: { es2022: true, node: true, browser: true },
  extends: ["eslint:recommended","plugin:import/recommended","prettier"],
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  rules: { "import/order": ["warn", { "newlines-between": "always" }] }
};
CJS

cat > .prettierrc <<'JSON'
{ "printWidth": 88, "singleQuote": true, "semi": true }
JSON

# 5) VS Code niceties
cat > .vscode/settings.json <<'JSON'
{ "editor.formatOnSave": true, "editor.codeActionsOnSave": { "source.fixAll.eslint": true } }
JSON

# 6) Minimal web app (Vite-free, zero deps HTML/JS to start)
cat > apps/web/public/index.html <<'HTML'
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>DeCrypt the Girl — Agent Console</title>
  </head>
  <body>
    <h1>DeCrypt the Girl — Agent Console</h1>
    <textarea id="prompt" rows="6" style="width:100%" placeholder="Ask the Repo Agent to do something…"></textarea>
    <button id="run">Run</button>
    <pre id="out"></pre>
    <script type="module">
      document.getElementById('run').onclick = async () => {
        const prompt = document.getElementById('prompt').value;
        const res = await fetch('/agent/run', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({prompt})});
        document.getElementById('out').textContent = await res.text();
      };
    </script>
  </body>
</html>
HTML

# 7) Minimal Firebase hosting + function proxy to agent
cat > firebase.json <<'JSON'
{
  "hosting": {
    "public": "apps/web/public",
    "ignore": ["firebase.json","**/.*","**/node_modules/**"],
    "rewrites": [{ "source": "/agent/**", "function": "agent" }]
  },
  "functions": { "source": "functions" }
}
JSON

cat > functions/package.json <<'JSON'
{
  "name": "agent-functions",
  "engines": { "node": "20" },
  "dependencies": {
    "firebase-functions": "^5.0.0",
    "firebase-admin": "^12.6.0",
    "node-fetch": "^3.3.2"
  },
  "type": "module"
}
JSON

cat > functions/index.js <<'JS'
import * as functions from "firebase-functions";
import fetch from "node-fetch";

// Proxy to local agent runner (Gemini CLI wrapper) you’ll host on Cloud Functions later.
// For now it echoes so deploy works out-of-the-box.
export const agent = functions.https.onRequest(async (req, res) => {
  const { prompt } = req.body || {};
  res.set('Content-Type','text/plain');
  res.send(`Agent received: ${prompt ?? "(no prompt)"}\n→ Wire to Gemini soon.`);
});
JS

# 8) Repo Agent (Gemini CLI wrapper)
mkdir -p packages/agent .gemini .gcp
cat > packages/agent/run.js <<'JS'
#!/usr/bin/env node
import { spawn } from 'node:child_process';
const args = process.argv.slice(2);
const prompt = args.join(' ') || 'Summarize repo health and next actions.';
const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(cmd, ['gemini', prompt], { stdio: 'inherit' });
child.on('exit', code => process.exit(code ?? 0));
JS
chmod +x packages/agent/run.js

cat > .gemini/config.yaml <<'YAML'
model: "gemini-1.5-pro"
system_prompt: |
  You are Repo Agent for TheAVCfiles/codex. Operate like a build engineer:
  - Propose precise git diffs.
  - Use Conventional Commits.
  - Keep output as actionable shell blocks.
tools:
  - name: shell
    allow: ["git","npm","npx","firebase","node","sed","awk","grep"]
playbooks:
  - name: "repo: tidy"
    prompt: "Run ESLint+Prettier, list autofixes, propose diffs for any errors."
  - name: "deploy: firebase"
    prompt: "Build web, run tests, then deploy hosting+functions."
  - name: "docs: readme"
    prompt: "Generate tight README for this monorepo with usage and CI status."
YAML

# 9) CI (lint, test, build) + Deploy workflow
cat > .github/workflows/ci.yml <<'YML'
name: CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint
      - run: npm run test --if-present
      - run: npm run build
YML

cat > .github/workflows/deploy.yml <<'YML'
name: Deploy to Firebase
on:
  push:
    branches: [main]
    paths:
      - "apps/**"
      - "functions/**"
      - "firebase.json"
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run build --if-present
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: "${{ secrets.GITHUB_TOKEN }}"
          firebaseServiceAccount: "${{ secrets.FIREBASE_SERVICE_ACCOUNT }}"
          channelId: live
        env:
          FIREBASE_CLI_EXPERIMENTS: webframeworks
YML

# 10) CODEOWNERS, gitignore, license, README
cat > .github/CODEOWNERS <<'TXT'
* @xoAVCxo
TXT

cat > .gitignore <<'TXT'
node_modules
.DS_Store
.env
.gcp/credentials.json
firebase-debug.log
TXT

cat > LICENSE <<'TXT'
Apache License 2.0
TXT

cat > README.md <<'MD'
# TheAVCfiles / codex — Clean Monorepo

**Apps**
- `apps/web` — minimal agent console (Firebase Hosting).
- `functions` — HTTP function proxy for `/agent/run`.

**Agent**
- `packages/agent` — thin wrapper around Gemini CLI (`npx gemini`).
- Config lives in `.gemini/config.yaml`.

**Commands**
```bash
npm run setup
npm run dev       # (static page)
npm run agent -- "Plan a repo tidy"
npm run deploy    # requires Firebase secret (see below)
# User-provided custom instructions

https://platform.openai.com/storage/vector_stores/vs_6859e43920848191a894dd36ecf0595a
MD
