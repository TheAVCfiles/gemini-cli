# Welcome to Gemini CLI documentation

This documentation provides a comprehensive guide to installing, using, and developing Gemini CLI. This tool lets you interact with Gemini models through a command-line interface.

## Overview

Gemini CLI brings the capabilities of Gemini models to your terminal in an interactive Read-Eval-Print Loop (REPL) environment. Gemini CLI consists of a client-side application (`packages/cli`) that communicates with a local server (`packages/core`), which in turn manages requests to the Gemini API and its AI models. Gemini CLI also contains a variety of tools for tasks such as performing file system operations, running shells, and web fetching, which are managed by `packages/core`.

## Navigating the documentation

This documentation is organized into the following sections:

- **Execution and Deployment**
  - **[Running locally and in sandboxes](./deployment.md):** Information for running Gemini CLI.
  - **[Firebase Hosting quick start](./firebase-hosting.md):** Deploy the MWRA glossary demo with a single Firebase project.
- **[Architecture Overview](./architecture.md):** Understand the high-level design of Gemini CLI, including its components and how they interact.
- **CLI Usage:** Documentation for `packages/cli`.
  - **[CLI Introduction](./cli/index.md):** Overview of the command-line interface.
  - **[Commands](./cli/commands.md):** Description of available CLI commands.
  - **[Configuration](./cli/configuration.md):** Information on configuring the CLI.
  - **[Checkpointing](./checkpointing.md):** Documentation for the checkpointing feature.
  - **[Extensions](./extension.md):** How to extend the CLI with new functionality.
  - **[IDE Integration](./ide-integration.md):** Connect the CLI to your editor.
  - **[Telemetry](./telemetry.md):** Overview of telemetry in the CLI.
- **Core Details:** Documentation for `packages/core`.
  - **[Core Introduction](./core/index.md):** Overview of the core component.
  - **[Tools API](./core/tools-api.md):** Information on how the core manages and exposes tools.
- **Tools:**
  - **[Tools Overview](./tools/index.md):** Overview of the available tools.
  - **[File System Tools](./tools/file-system.md):** Documentation for the `read_file` and `write_file` tools.
  - **[Multi-File Read Tool](./tools/multi-file.md):** Documentation for the `read_many_files` tool.
  - **[Shell Tool](./tools/shell.md):** Documentation for the `run_shell_command` tool.
  - **[Web Fetch Tool](./tools/web-fetch.md):** Documentation for the `web_fetch` tool.
  - **[Web Search Tool](./tools/web-search.md):** Documentation for the `google_web_search` tool.
  - **[Memory Tool](./tools/memory.md):** Documentation for the `save_memory` tool.
  - **[MCP Quickstart](./tools/mcp-quickstart.md):** Step-by-step guide for connecting Toolbox and MCP Inspector.
- **Examples:**
  - **[Vertex AI Search integration](./examples/vertex-ai-search.md):** Step-by-step guidance for connecting Gemini CLI agents to Vertex AI Search.
  - **[Mechanotransduction simulation](./examples/mechanotransduction-simulation.md):** End-to-end tactile encoding pipeline with vibration synthesis, receptor filters, spikes, and somatotopic maps.
  - **[IntuitionLabs Ballet Bots curriculum assets](./intuitionlabs/README.md):** Reference materials for an arts-and-robotics learning program that leverages Gemini CLI for content generation.
- **Heritage & Provenance:**
  - **[Rovagnasca–Casa Savoia archival dossier](./provenance/rovagnasca-casa-savoia.md):** Official correspondence summary for the Prati di Rovagnasca lineage and MythOS™ node reference.
- **[Contributing & Development Guide](../CONTRIBUTING.md):** Information for contributors and developers, including setup, building, testing, and coding conventions.
- **[NPM](./npm.md):** Details on how the project's packages are structured
- **[Troubleshooting Guide](./troubleshooting.md):** Find solutions to common problems and FAQs.
- **[Serverless model catalog](./serverless-models.md):** Look up the Together AI serverless models that Gemini CLI can reach.
- **[Terms of Service and Privacy Notice](./tos-privacy.md):** Information on the terms of service and privacy notices applicable to your use of Gemini CLI.
- **[Releases](./releases.md):** Information on the project's releases and deployment cadence.

We hope this documentation helps you make the most of the Gemini CLI!
