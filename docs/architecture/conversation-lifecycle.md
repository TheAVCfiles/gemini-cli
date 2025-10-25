# Conversation lifecycle

This document follows the Gemini CLI conversation loop from startup to the
moment a response is rendered in the terminal. It is meant to complement the
[architecture overview](./../architecture.md) by describing the moving pieces
that keep an interactive session responsive.

## 1. Bootstrapping the session

1. The entry point (`packages/cli/src/gemini.tsx`) loads settings, parses CLI
   arguments, and builds a core `Config` instance through
   `loadCliConfig(...)`. The same module decides whether to run in interactive
   or non-interactive mode and, for interactive sessions, calls
   `startInteractiveUI(...)` to render `<AppWrapper />` from Ink.
2. During `Config.initialize()` (`packages/core/src/config/config.ts`) the core
   tool registry, prompt registry, file discovery service, and telemetry wiring
   are brought online so that downstream hooks can rely on consistent
   dependencies.

## 2. Authenticating and creating the Gemini client

- The `useAuthCommand` hook inside `App.tsx` watches the selected authentication
  type. As soon as an auth method is available, it invokes
  `config.refreshAuth(...)`, which constructs a `GeminiClient`, establishes the
  content generator, and restores any saved conversation history. This step also
  resets fallback state when switching between auth providers.

## 3. Wiring the UI to the core

- The Ink application (`App.tsx`) calls
  `useGeminiStream(config.getGeminiClient(), ...)` once configuration and
  history hooks are ready. The stream hook combines three responsibilities:
  collecting user messages, routing slash/`@` commands, and managing the queue of
  Gemini responses and tool calls.
- `useGeminiStream` coordinates the `useReactToolScheduler` helper so that tool
  requests flow through a predictable lifecycle: request → optional user
  confirmation → execution → response delivery back to the model.

## 4. Inside the Gemini core turn

- `GeminiClient.startChat()` seeds every conversation with environment context
  (workspace metadata, IDE state, etc.) and publishes the tool declarations that
  the current configuration allows. The helper also injects memory from
  discovered `GEMINI.md` files before any user prompts are sent.
- When the UI submits a prompt, `GeminiClient` spins up a `Turn` object
  (`packages/core/src/core/turn.ts`). The turn streams events back to the UI:
  token deltas, thought summaries, tool call requests, confirmation prompts,
  tool results, and final finish reasons. Compression and loop-detection hooks
  update the stream with additional events if the model needs to retry or shed
  history.

## 5. Completing the cycle

- Once the `Turn` signals `Finished`, `useGeminiStream` persists the new history
  items, clears transient tool state, and returns control to the input prompt.
  If automatic approval is active, the hook also logs session metrics for use in
  telemetry and quota fallback tracking.
- Any tool that modified memory (for example the `save_memory` tool) triggers a
  refresh through the same hook so that the UI immediately reflects the updated
  foundation for future prompts.
