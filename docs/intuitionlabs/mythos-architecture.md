# MythOS™ Operational Topology

This document captures the current high-level structure of the MythOS™ ecosystem, the relationships between its constituent programs, and the flow of value between them. It is intended to complement the existing Intuition Labs and AVC Systems Studio documentation by making the cross-organizational dependencies explicit.

```mermaid
flowchart TB
  %% Core Nucleus
  NUC[MythOS™ Nucleus\n(One repo • One Notion Atlas • Daily Changelog)]

  %% Quadrants
  A[Decrypt the Girl™\nNarrative OS\n• Surface / Cipher / Echo\n• Rooms / Nodes / Scroll\n• Glitch Deck • Zodiac Decoder]
  B[Sojourner Network\nEthical Infra\n• Aid Nodes • Ledger\n• Front Stores • Protocols]
  C[Intuition Labs / AVC Systems Studio\nEducation & R&D\n• Ballet Bots • SHE-PT™\n• Studio Courses • Tooling]
  D[Financial & Legal Stack\nCapital Engine\n• IP/Trademark • Licenses\n• Foundation • Smart Agreements]

  %% Nucleus links
  NUC --- A
  NUC --- B
  NUC --- C
  NUC --- D

  %% Data / Value Flows
  A -- "IP + Storyworld \n(Series A/B/C, cipher logic)" --> C
  C -- "Curricula, toolkits,\ncerts, APIs" --> D
  D -- "Funding, royalties,\nprogram budgets" --> B
  B -- "Impact metrics,\nbeneficiary signals" --> D
  B -- "Field feedback" --> A
  C -- "User research,\nlearning analytics" --> A

  %% Operative Spine
  subgraph OPS[Operations Spine]
    direction TB
    SSOT[Single Source of Truth (GitHub repo)\n/docs • /systems • /scroll • /ops]
    ATLAS[Notion 'MythOS Atlas'\nNodes mapped to files + owners + status]
    RITUAL[Daily Changelog\n(Date • Project • Output • Next step)]
  end

  NUC --- OPS
  A --- ATLAS
  B --- ATLAS
  C --- ATLAS
  D --- ATLAS
  SSOT --> A
  SSOT --> B
  SSOT --> C
  SSOT --> D

  %% Modes inside Decrypt the Girl
  subgraph A2[Surface / Cipher / Echo]
    direction LR
    SUR[Surface\n(reader-facing layer)]
    CIP[Cipher\n(structural/poetic crypto)]
    ECH[Echo\n(reader input → system response)]
  end
  A --- A2

  %% AI Roles (no overlap)
  subgraph AI[Agent Roles]
    direction LR
    G[Gemini: long-form & research]
    CHAT[ChatGPT: synthesis, arch, cohesion]
    COP[Copilot: code execution]
  end
  AI --- NUC
  G --> SSOT
  CHAT --> ATLAS
  COP --> SSOT
```

## Reading the Diagram

- **Nucleus** – The single repository, Notion workspace, and daily changelog form the canonical operating spine. They bind all quadrants through shared context and ritualized updates.
- **Quadrants** – Each quadrant focuses on a distinct operational domain, yet all stay synchronized with the nucleus and contribute to the shared roadmap.
- **Data & Value Loops** – Arrows illustrate how story IP, educational tooling, funding, and social impact metrics circulate. These loops ensure that creative output, infrastructure, learning, and capital reinforce one another.
- **Operations Spine** – The SSOT, MythOS Atlas, and Daily Changelog sit in the middle of every workflow, providing coordination, accountability, and historical traceability.
- **Decrypt the Girl Modes** – Surface, Cipher, and Echo define how narrative artifacts are produced, encrypted, and reflected back through audience interaction.
- **AI Agent Roles** – Distinct responsibilities for Gemini, ChatGPT, and Copilot eliminate overlap: research feeds the SSOT, synthesis curates the Atlas, and code execution maintains the repository.

## Usage Guidance

Embed this diagram in planning and onboarding materials to quickly orient collaborators. Because it is written in Mermaid, it can be rendered in Markdown viewers that support Mermaid diagrams, or exported to static images for slide decks and executive summaries.
