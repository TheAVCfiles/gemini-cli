# Gemini CLI Architecture Overview

The Gemini CLI is a polyglot workspace where conversational AI, local tooling, and
developer workflows meet. This document traces the major structures that keep the
system coherent and adaptable.

## Monorepo layout

The repository is organized as a monorepo. Each package provides a discrete layer
of functionality that can evolve independently while sharing a common core.

- **`packages/core`** – Runtime brain for orchestrating Gemini requests, tool
  execution, telemetry, and session state.
- **`packages/cli`** – Terminal interface that collects user input, renders
  responses, and mediates approvals for tool execution.
- **`packages/a2a-server`** – Lightweight server that exposes the same orchestration
  primitives over HTTP for agent-to-agent or automated integrations.
- **`packages/test-utils`** – Shared fixtures and helpers to keep integration tests
  deterministic across packages.
- **`packages/vscode-ide-companion`** – Bridges Gemini Core into an IDE companion
  surface, reusing the same orchestration pipeline.

## Core subsystems

Within `packages/core`, responsibilities are divided across dedicated domains:

- **Conversation orchestration (`src/core/`)** – `GeminiClient`, `GeminiChat`, and
  the `Turn` model maintain chat state, apply token limits, compress history when
  necessary, and decide whether a response or tool call is needed.
- **Prompt and context assembly (`src/core/prompts.ts`, `src/utils/` and
  `src/ide/`)** – Collect environment data, IDE context, and cached history to
  shape the request sent to Gemini. Environment summaries are generated through
  `getEnvironmentContext` and `getDirectoryContextString`.
- **Tooling (`src/tools/`, `src/core/coreToolScheduler.ts`,
  `src/core/nonInteractiveToolExecutor.ts`)** – Declarative tool metadata allows
  Gemini to request capabilities. The scheduler sequences requests, enforces
  safety prompts, and streams intermediate tool results back into the
  conversation.
- **Configuration (`src/config/`)** – Wraps CLI flags, environment variables, and
  persisted preferences to drive model selection, proxy support, and session IDs.
- **Services and observability (`src/services/`, `src/telemetry/`)** – Cross-cutting
  helpers like the `LoopDetectionService`, logging instrumentation, and telemetry
  event factories guard against runaway loops and surface diagnostics.

## Request lifecycle

```
┌─────────────┐      ┌───────────────┐      ┌────────────────┐      ┌───────────────┐
│ CLI surface │ ───▶ │ GeminiClient  │ ───▶ │ Gemini API      │ ───▶ │ Tool Scheduler │
└─────────────┘      │  (core)       │ ◀─── │ (responses/     │ ◀─── │  & Executor   │
       ▲             └───────────────┘      │  tool calls)    │      └───────────────┘
       │                    │                └────────────────┘              │
       │                    ▼                         ▲                      │
       │             History compression,             │                      │
       │             prompt assembly,                 │                      ▼
       │             loop detection        Tool output streamed back   Local environment
       │                                                                  operations
       │
       └────────────────────────────────────── Final response ────────────────────────┘
```

1. **CLI intake** – `packages/cli` gathers the prompt, renders local context, and
   forwards the request to the Core package via the shared SDK.
2. **Core preparation** – `GeminiClient` composes the system prompt, recent
   history, environment context, and IDE snippets into a `GenerateContent`
   payload. Token limits (`tokenLimits.ts`) and compression rules ensure the
   request stays within model budgets.
3. **Gemini response** – The Gemini API may return text, a tool invocation, or an
   error. Responses stream back through `GeminiChat` to maintain turn ordering.
4. **Tool execution** – When tool calls arrive, the core scheduler resolves the
   handler from `src/tools`, ensures any required approval has been granted, and
   executes the operation (filesystem, shell, web, etc.). Results feed back into
   the same turn so Gemini can continue reasoning.
5. **Render to user** – The CLI formats the final answer, progressive tool
   updates, and telemetry warnings for display in the terminal or IDE.

## Extension surfaces

Because the orchestration logic is centralized inside `packages/core`, new
surfaces can be layered on without rewriting the reasoning engine:

- **Terminal UX (`packages/cli`)** – Rich prompt history, themes, and key bindings
  built with React Ink components.
- **Automations (`packages/a2a-server`)** – Exposes the same request lifecycle to
  other agents or CI workflows via a minimal HTTP contract.
- **Editor integrations (`packages/vscode-ide-companion`)** – Shares the session
  and telemetry stack to deliver inline suggestions inside editors.

## Design principles

- **Separation of concerns** – Frontends own user experience while Core owns
  orchestration, allowing new surfaces without duplication.
- **Safety as a first-class workflow** – Tool scheduling, loop detection, and
  approval prompts are built into the main request pipeline rather than added as
  afterthoughts.
- **Observability** – Detailed telemetry events (`src/telemetry/`) and consistent
  logging provide insight into latency, tool usage, and error modes, supporting
  iterative tuning.
- **Composable context** – System prompts, IDE data, and environment snapshots are
  treated as modular inputs so specialized surfaces can remix them without
  rewriting the foundation.
