# Daily Execution Template

This template translates the mental operating system into a concrete daily workflow you can run in Notion, Google Tasks, or any plain-text system. Each block mirrors a command-line interface so you can queue, execute, and log actions without cognitive overhead.

## 1. Command Line Queue

Create a database or list titled **Command Line**. Each entry is a single executable command.

| Property | Type | Example |
| --- | --- | --- |
| `Command` | Title/Text | `/execute: Draft Fiverr offer page` |
| `Status` | Select | `Queued`, `Running`, `Complete`, `Blocked` |
| `Progress` | Number (%) or text | `40` |
| `Next` | Text | `/next: build delivery automation` |
| `Context` | Relation/Tags (optional) | `Client Work`, `Marketing` |

**Usage**
1. Brain-dump all actionable items into the queue using the `/execute:` syntax.
2. When the mind freezes, filter for the first `Queued` item and set `Status` to `Running`.
3. Update `Progress` after each micro-sprint.
4. Move finished commands to `Complete` and archive weekly.

## 2. Micro-Sprint Timer

Add a **Micro-Sprint** linked database or toggle with pre-set durations (5, 10, 15 minutes). Embed a timer widget or use a phone timer.

- `Sprint Objective`: e.g., `Edit first 3 sentences of landing page`
- `Duration`: Select 5, 10, or 15 minutes
- `Result Notes`: Quick bullet on what moved forward

**Automation tip:** In Notion, set a template button named **Launch Sprint** that creates a new entry with the current timestamp and a 10-minute default duration.

## 3. CEO vs. Maker Blocks

Create two calendar views:

- **CEO Block (Strategy)** — schedule in the morning. Include agenda properties like `Decision Needed`, `Research`, `Planning`.
- **Maker Block (Execution)** — schedule after CEO time. Include `Primary Command` property that links back to the Command Line queue.

Use Notion formulas or Google Calendar colors to visually separate the blocks. The goal is to protect deep work time from decision fatigue.

## 4. Dopamine Automation

Set up a **Done Log** database or simple page with the following properties:

- `Date`
- `Completed Command`
- `Energy Level` (1-5)
- `Reward` (what you gifted yourself)

At the end of each day, roll up the count of completed commands and review the log during CEO time to reinforce the progress loop.

## 5. Daily Constraint Rules

Embed a callout or text block with the governing rules:

- **Three Priorities per Day** — link the top three Command Line items you commit to execute.
- **Parking Lot** — a separate database view for ideas/tasks that are not part of today’s queue.
- **Offload Rule** — reminder text: “If it isn’t written here, it doesn’t exist.”

## 6. Freeze Recovery Protocol

Create a template page titled **System Reboot** with the following checklist:

1. `☐ Change body state (walk/stretch/breathe)`
2. `☐ Hydrate or snack`
3. `☐ Run smallest command (/execute: open doc)`
4. `☐ Start 5-minute sprint`
5. `☐ Update Command Line status`

Keep this template pinned at the top of your workspace for quick access when overwhelm hits.

---

### Suggested Daily Flow

1. **Morning CEO Session (15-30 min)**
   - Review Command Line queue and select three priorities.
   - Schedule Maker blocks and set sprint objectives.
   - Review Done Log from previous day.
2. **Maker Blocks**
   - Launch micro-sprints for each priority.
   - Update progress and Done Log after each sprint.
3. **Evening Shutdown (10 min)**
   - Archive completed commands.
   - Reflect on energy levels and rewards.
   - Prep top commands for tomorrow.

This template keeps executive and creative functions synchronized, minimizes context switching, and preserves momentum for polymath creators.
