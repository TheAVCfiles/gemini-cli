# Repository Operating Instructions

## Preservation Protocol

- Treat `vault/inbox/raw/` as append-only.
- Never overwrite or edit raw source files.
- Never replace an existing product or interface unless the user explicitly says “replace.”
- New concepts default to a new file, route, component, branch, or version.
- Before any deletion or major rewrite, identify what will be removed and obtain approval.
- Preserve superseded material instead of deleting it.
- Separate archival, analysis, canonicalization, and implementation into distinct commits.
- After every GitHub operation, report the branch, commit SHA, and remote URL.
- A local commit is not considered remotely preserved until the push is confirmed.

## Archive Workflow

When the user invokes `ARCHIVE MODE`, preserve the raw material before interpreting it:

1. Save the material verbatim as a new file in `vault/inbox/raw/YYYY-MM-DD-[short-name].md`.
2. Add only a short metadata header with capture date, source, and status.
3. Do not overwrite an existing archive file; add `-02`, `-03`, etc. when needed.
4. Add the new raw archive to `vault/INDEX.md`.
5. Commit archive-only changes separately.
6. Stop after archiving unless the user explicitly asks for the next phase.

When the user invokes `PROCESS ARCHIVE`, create analysis separately from raw and canonical files:

1. Read the named raw file without modifying it.
2. Create a matching analysis file under `vault/analysis/`.
3. Identify original concepts, reusable operating rules, architectural decisions, contradictions, unresolved questions, possible products or skills, and candidate canonical updates.
4. Do not update canonical documents until approved.
5. Commit analysis-only changes separately.

When the user invokes `CANONICALIZE APPROVED CHANGES`, apply only approved changes:

1. Update the relevant files in `vault/canonical/`.
2. Preserve superseded language in `vault/superseded/`.
3. Create a decision record in `vault/decisions/` explaining what changed and why.
4. Show the diff before committing when requested by the user.
5. Do not modify application code unless explicitly requested.
