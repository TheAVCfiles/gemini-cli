# StagePort Architecture Guide

StagePort is the memory + portal OS for preserving and serving embodied pedagogy as an executable system. This guide answers three questions up front: what StagePort is, where each part lives, and how it ships in four phases.

## What this document covers
- **System overview:** How the Director's Chair vision anchors the platform.
- **Where things live:** Repository and surface boundaries for the documentation, portal frontend, and future services.
- **How it ships:** A four-phase roadmap from documentation-only assets to fully connected credential engines.
- **Data movement:** How Notion, future API services, the portal, and external tools exchange data.

## Seven architectural arcs
1. **Director's Chair** – The narrative that binds brand, pedagogy, and delivery across repos.
2. **Operational** – Intake, moderation, and safety flows that govern participation.
3. **Portal** – StagePort web surfaces (Faculty, Assignments, Callboard, Studio) that present the system to end users.
4. **System** – Shared UI primitives, design tokens, and client hooks that keep surfaces coherent.
5. **Brand** – Visual grammar (palette, typography, iconography) that signals StagePort identity.
6. **Memory** – Knowledge capture (Notion databases, recordings, ledgers) and how they become structured domain objects.
7. **Synthesis** – How captured memory recombines into credentials, reports, and future analytics.

## Data flow and APIs
- **Source of truth:** Notion workspaces hold Faculty, Assignments, and rehearsal artifacts.
- **Adapters:** Typed adapters transform Notion rows into domain objects (e.g., `NotionFacultyRecord -> FacultyMember`).
- **Portal consumption:** The StagePort frontend reads domain objects via a read-only API; write actions are scoped to safe mutations (e.g., feedback, reflections) in later phases.
- **External services:** Stripe (payments), Vercel (hosting), GitHub (automation), and future credential engines feed telemetry into Memory and Synthesis arcs.

## Repository boundaries
- **This repo (documentation):** Narrative, specs, diagrams, and implementation contracts under `docs/stageport/`.
- **`stageport-ui`:** Portal frontend components (e.g., `StageportFacultyPage.jsx`), design tokens, and hooks.
- **`stageport-server` (future-ready):** API layer that mediates Notion, credential engines, and portal clients.

## Four-phase implementation plan
1. **Documented blueprint** – Centralize architecture, role-based navigation, and implementation specs (current phase).
2. **Scaffolded UI** – Implement portal components with mock data (`StageportFacultyPage`, `FacultyList`, `FacultyCard`) and shared UI primitives.
3. **Notion-backed read path** – Add typed adapters and a read-only API that hydrates the portal from Notion without mutating source tables.
4. **Credential + commerce integration** – Introduce credential engines, payments, and analytics while preserving the safety and brand constraints defined in the Director's Chair.

## Reading guide
- **Start here:** `INDEX.md` for role-based navigation and quick entry points.
- **Need the map?** Open `component_map.mmd` in Mermaid Live Editor to visualize data flows and boundaries.
- **Implementing the Faculty Page?** Follow `FACULTY_PAGE_IMPLEMENTATION.md` for component contracts, states, and adapter seams.
