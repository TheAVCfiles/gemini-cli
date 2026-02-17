# Chrome DevTools MCP server quickstart

This guide shows how to wire the **chrome-devtools-mcp** server into the Gemini CLI so the model can open pages, click links, capture console/network data, run performance traces, and take screenshots like a lightweight QA assistant.

## Why use it?

Once configured, you can ask the model to:

- Launch a headless, isolated Chrome instance
- Navigate to your app or prototype URLs
- Click through links and record HTTP status codes
- Collect console errors and network failures
- Capture performance traces (LCP, blocking scripts, layout shifts)
- Generate screenshots and short UX summaries

This turns Gemini into an automated QA intern that can inspect live deployments without manual clicking.

## Minimal configuration (safe defaults)

Add the MCP server to your Gemini CLI `settings.json` (requires Node 20+ and Chrome installed locally):

```jsonc
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "-y",
        "chrome-devtools-mcp@latest",
        "--headless=true",
        "--isolated=true",
      ],
    },
  },
}
```

- `--headless=true` avoids opening a Chrome window every run.
- `--isolated=true` uses a temporary profile, keeping your personal browser data untouched.

> Start with this contained setup. You only need `--browser-url` or `--wsEndpoint` if you intentionally want to attach to an existing Chrome with your own profile (usually unnecessary and less safe).

## Smoke-test prompt

After saving `settings.json`, run a quick prompt to confirm connectivity:

> “Check the performance of https://developers.chrome.com.”

A successful run should return a performance summary with trace metrics and network/console findings.

## Example prompts for hub/prototype QA

Use these to exercise the server on a hub page that lists prototype links.

### Broken links audit

> “Open <HUB_URL>, find all links under the prototypes section, click them one by one. For each, report the final URL, HTTP status, any console errors on load, and whether the main content renders. Return a table and suggest fixes for failures.”

### Performance sanity check

> “Navigate to <PROTOTYPE_URL>. Run a performance trace, then summarize the Largest Contentful Paint, blocking scripts, and obvious layout shifts. Suggest minimal code changes to improve perceived speed.”

### Visual regression / screenshot catalog

> “For each prototype linked from <HUB_URL>, take a screenshot of the loaded view (e.g., stageport.png, ballet-bots.png). Describe what you see in one paragraph, focusing on UX coherence and readability.”

These prompts produce concrete, repeatable QA outputs without manual browsing.

## How it fits with repository intelligence (Archivist)

Pair the DevTools MCP checks with your repo-level “Archivist” bot:

- **Archivist:** summarizes each repo (intent, current state, next step, stage label).
- **DevTools MCP:** validates deployed routes (load status, performance grade, screenshot, console/network errors).

Surface both on your hub: each prototype card can show the repo summary plus the latest live-check results so you know what to fix next.
