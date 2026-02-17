# Prompt templates

Prompt templates let you turn a frequently repeated instruction into a reusable slash command. Each template is a small TOML file that the CLI discovers and turns into a `/command` you can run in any chat.

## Where templates live and how they are named

- **Global templates:** `~/.gemini/commands/`
- **Project templates:** `<project>/.gemini/commands/`
- **Naming:** The command name mirrors the file path. `~/.gemini/commands/test.toml` becomes `/test`, while `<project>/.gemini/commands/git/commit.toml` becomes `/git:commit`.
- **Precedence:** If the same name exists in both locations, the project copy wins so teams can override a personal default.

## Quick start

1. Create `<project>/.gemini/commands/brief.toml`.
2. Paste a prompt body:

```toml
description = "Summarize any topic concisely."
prompt = "Write a 3-bullet summary about {{args}}."
```

3. Run `/brief Kafka streams` in Gemini CLI.
4. The CLI replaces `{{args}}` with `Kafka streams`, sends the prompt, and shows the response inline.

## Adding arguments

### Raw argument injection with `{{args}}`

- Use `{{args}}` anywhere in the prompt to splice in what the user typed after the slash command.
- Outside of shell blocks the text is inserted verbatim (no escaping) so the model sees exactly what the user wrote.

### Default argument handling

- If `{{args}}` is **absent**, the CLI appends the full invocation (e.g., `/brief Kafka streams`) to the end of the prompt so the model still sees the user’s parameters.

## Running shell commands from a template

You can execute shell commands as part of a prompt by wrapping them in `!{ ... }` blocks. The CLI automatically guards these commands:

- Any `{{args}}` inside `!{ ... }` is **shell-escaped** before substitution, preventing command-injection tricks.
- The resolved command is checked against your shell allowlist/denylist. If it is blocked or requires approval, the CLI will either refuse to run it or ask you to confirm before proceeding.
- Execution output (stdout/stderr) is inserted back into the prompt so the model can reason over the results.

**Example (`search/grep.toml`):**

```toml
description = "Search the repo for a pattern and summarize it."
prompt = """
Look for '{{args}}' in the project.
Results:
!{rg --hidden {{args}} .}
"""
```

When you run `/search:grep auth token`, the CLI escapes `auth token`, prompts you to approve `rg --hidden "auth token" .` if necessary, and injects the command output into the prompt.

## Injecting file content with `@{path}`

Use `@{...}` inside a prompt to pull file contents directly into the message without copy-pasting:

- Paths are resolved relative to the project root and respect `.gitignore`/`.geminiignore` filters. Ignored files are skipped and a notice is shown.
- The injected file is converted into multi-part content so the model receives both text and binary attachments correctly.

**Example (`reviews/spec.toml`):**

```toml
prompt = """
Summarize this spec:
@{docs/api.md}
"""
```

## Sharing templates with your team

- Commit project templates under `.gemini/commands/` so teammates get the same shortcuts.
- Namespaced files (e.g., `qa/regressions.toml` → `/qa:regressions`) keep related templates organized.
- Restarting the CLI or running `/help` after adding files refreshes the command list.

## Tips and troubleshooting

- Keep braces balanced. Unclosed `!{` or `@{` blocks prevent the command from loading.
- Use `description` to make `/help` outputs readable.
- If a shell command is denied, adjust your allowlist or run with the prompted confirmation when appropriate.
