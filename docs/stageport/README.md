# StagePort Component Architecture Guide

**Last Updated:** 2025-12-04

> **Quick Navigation**
> - [Component Map Diagram](./component_map.mmd) - Visual guide to how components are organized
> - [Faculty Page Implementation](./FACULTY_PAGE_IMPLEMENTATION.md) - Detailed specs for faculty management
> - [System Diagram](./stageport_directors_chair.mmd) - Original Mermaid architecture diagram
> - [Notion Template](./stageport_notion_master_template.md) - Database setup guide

## Overview

StagePort is a comprehensive studio management and credentialing platform designed for performance arts organizations. This guide explains how the various components across different systems and repositories work together.

**Problem Solved:** This documentation helps make sense of scattered components across multiple repositories by providing:
1. A clear architecture overview
2. Component relationship mappings
3. Implementation specifications for each piece
4. Data flow examples

## Architecture Layers

### 1. Director's Chair (Command Deck)

The central command and control interface that orchestrates all other components.

**Key Components:**
- **Metrics & Orchestration** - Dashboard showing system-wide KPIs
- **Signal Router** - Routes notifications and data between subsystems
- **Safety/Title IX Alerts** - Critical incident management

### 2. Operational Arc

Day-to-day business operations components.

#### Clients & Faculty CRM
- **Purpose**: Manage relationships with students, parents, faculty, and partners
- **Implementation**: Notion database with custom views
- **Key Features**:
  - Role-based filtering (Student, Parent, Faculty, Guardian, Partner, Investor)
  - Status tracking (Lead, Active, Alumni, Prospect, Pause)
  - Consent management
  - Linked to projects, credentials, and transactions

#### Faculty Panel Component
The **Faculty Panel** is a dedicated view within the CRM system:

**Location**: Director's Chair Dashboard → People Database → Faculty View

**Configuration**:
```
Filter: Role = Faculty
Group By: Credential Level (Bronze, Silver, Gold)
Sort: Name (A-Z)
Display Properties:
  - Name
  - Email
  - Phone
  - Studio/Company
  - Linked Credentials (count)
  - Active Projects (count)
  - Status
```

**Related Components**:
- `People` database (Notion)
- `Credentials` database (for badge display)
- `Projects` database (for active assignments)

#### Projects / Productions
- **Purpose**: Track classes, workshops, residencies, and productions
- **Stages**: Idea → Alpha → MVP → Live
- **Links**: People, Offers, Credentials, Transactions

#### Franchise & Sales Pipeline
- **Purpose**: Manage studio expansion and partnership opportunities
- **Stages**: Prospect → Discovery → Proposal → Legal → Launch → Live
- **Key Metric**: Expected Value (USD)

#### Sentient Cents / StageCred Ledger
- **Purpose**: Track all financial transactions and StageCred allocations
- **Currencies**: USD, SCC (Sentient Cents)
- **Transaction Types**: Payment, Allocation, Tip, Grant, Share

### 3. Portal Arc (Audience & Client Experience)

Public-facing and client-facing interfaces.

#### Vending Portal PLUS
- **Purpose**: Catalog of services and products
- **Tiers**: Free, B2C, B2B, White-label
- **Integration**: Links to GitHub repos and Vercel/Netlify deployments

#### Studio Kiosk
- **Purpose**: On-site enrollment, check-in, and payment processing
- **Features**:
  - Self-service enrollment
  - QR code check-in
  - Point-of-sale for classes and merchandise
  - Direct CRM integration

#### Studio Dashboard
- **Purpose**: Interface for instructors and students
- **Views**:
  - Instructor: Class roster, attendance, credential progress
  - Student: Schedule, progress, earned credentials

### 4. System Arc (APIs & Engines)

Backend services and processing engines.

#### StagePort API (stagecred_api.py)
- **Location**: `server/` or external microservice
- **Endpoints**:
  - `/api/credentials` - Credential issuance and verification
  - `/api/people` - CRM operations
  - `/api/projects` - Project management
  - `/api/ledger` - Transaction processing

#### StageCred Preview Engine
- **Purpose**: Generate credential previews before issuance
- **Output**: Visual badge mockups with rubric data

#### CTDL Badge Issuer
- **Purpose**: Issue standards-compliant credentials
- **Schema**: Uses `stagecred_ctdl_template.json`
- **Standard**: Credential Transparency Description Language (CTDL)
- **Features**:
  - Generates unique CTID identifiers
  - Links evidence documents (ProofTags)
  - Maintains credential registry

#### Astro-Economic Engine
- **Purpose**: Analyze market trends and timing
- **Integration**: Feeds data to Signal Analytics

### 5. Brand Arc (Offers & Communications)

Marketing and communication components.

#### Offer Library
- **Types**: SaaS, Service, IP, Course, Deck, Report, Script
- **Status**: Idea → Alpha → MVP → Live
- **Distribution**: Multiple tiers for different audiences

#### Executive/Title IX/Investor Decks
- **Purpose**: Presentation materials for stakeholders
- **Storage**: Memory Arc vault
- **Updates**: Quarterly or as needed

#### Press & Community
- **Purpose**: Public relations and community engagement
- **Links**: Case studies, quarterly reports, playbills

### 6. Memory Arc (Vault & Audit)

Long-term storage and historical records.

#### Contracts, ProofTags, Releases
- **Purpose**: Legal documents and evidence storage
- **Features**:
  - Hash-based verification
  - Immutable audit trail
  - GDPR-compliant consent tracking

#### Living Playbills / Oral Histories
- **Purpose**: Archive of performances and projects
- **Format**: Multimedia with metadata

#### Quarterly Reports & Case Studies
- **Purpose**: Document outcomes and impact
- **Uses**: Press releases, investor updates, franchise proposals

### 7. Synthesis Arc (Analytics & AI)

Intelligence and insights layer.

#### Signal Analytics
- **Purpose**: Aggregate and analyze system-wide metrics
- **Feeds**: All system data sources
- **Output**: Insights to Director's Chair

#### Oracle/Notebook Engines
- **Purpose**: AI-assisted decision support
- **Integration**: May use Gemini CLI for analysis workflows

## Component Mapping Across Repositories

### This Repository (gemini-cli)
**Location**: `docs/stageport/`
**Contents**:
- `README.md` - This architecture guide
- `stageport_directors_chair.mmd` - Mermaid diagram of system architecture
- `stageport_notion_master_template.md` - Notion database schema
- `stagecred_ctdl_template.json` - Credential template

**Purpose**: Documentation and templates for StagePort system design

### External Systems

#### Notion
- **Databases**: People, Projects, Franchise, Offers, Credentials, Ledger, Safety
- **Dashboard**: Director's Chair with custom views
- **Setup Guide**: See `stageport_notion_master_template.md`

#### GitHub Repositories
- **StagePort API**: Python Flask/FastAPI service (location TBD)
- **Portal Frontend**: React/Next.js application (location TBD)
- **Kiosk Application**: Electron or web app (location TBD)
- **CTDL Issuer**: Microservice for credential issuance (location TBD)

#### Hosting Platforms
- **Vercel/Netlify**: Portal and dashboard hosting
- **Stripe/Lemon Squeezy**: Payment processing
- **Jackrabbit/Mindbody**: Optional CRM import source

## Data Flow Examples

### Example 1: New Student Enrollment
```
Studio Kiosk → CRM (People) → Project (Class) → Ledger (Payment) → Dashboard (Student View)
```

### Example 2: Credential Issuance
```
Project (Completion) → Preview Engine → CTDL Issuer → Credentials DB → Vault (ProofTag) → Dashboard (Display)
```

### Example 3: Franchise Sales
```
Sales Pipeline → Proposal → Offers → Contract → Vault → Press → Community
```

### Example 4: Faculty Management
```
CRM (Faculty Role) → Faculty Panel → Credentials (View Badges) → Projects (Assignments) → Ledger (Payments)
```

## Implementation Roadmap

### Phase 1: Foundation (Current)
- [x] Document architecture
- [ ] Set up Notion databases
- [ ] Create StagePort API skeleton
- [ ] Implement CTDL credential schema

### Phase 2: Core Operations
- [ ] Build CRM integrations
- [ ] Implement Faculty Panel views
- [ ] Deploy credential preview engine
- [ ] Set up ledger system

### Phase 3: Portal Experience
- [ ] Launch Vending Portal
- [ ] Deploy Studio Kiosk
- [ ] Create Studio Dashboard
- [ ] Integrate payment processing

### Phase 4: Intelligence Layer
- [ ] Implement Signal Analytics
- [ ] Deploy Astro-Economic Engine
- [ ] Create Oracle/Notebook tools
- [ ] Build automated reporting

## FAQs

### Where is the Faculty Panel implemented?
The Faculty Panel is a **view configuration** within the Notion People database, not a separate component. See the "Faculty Panel Component" section above for configuration details.

### How do components communicate?
- **Notion ↔ API**: REST API or Notion SDK
- **API ↔ Frontend**: RESTful JSON APIs
- **Database Relations**: Notion's built-in relation properties
- **External Services**: Webhooks and API integrations

### What about StageportFacultyPage.jsx?
This would be a React component for rendering the Faculty Panel in a web interface. If building a custom portal:

**Suggested Structure**:
```jsx
// StageportFacultyPage.jsx
import { FacultyList } from './components/FacultyList';
import { CredentialBadges } from './components/CredentialBadges';
import { ProjectAssignments } from './components/ProjectAssignments';

export function StageportFacultyPage() {
  return (
    <div className="faculty-panel">
      <FacultyList 
        filterBy={{ role: 'Faculty' }}
        groupBy="credentialLevel"
        sortBy="name"
      />
      <CredentialBadges />
      <ProjectAssignments />
    </div>
  );
}
```

### How do I get started?
1. Review the Mermaid diagram: `stageport_directors_chair.mmd`
2. Set up Notion using: `stageport_notion_master_template.md`
3. Choose which arc to implement first based on your needs
4. Reference this guide for component relationships

## Related Documentation

- [Mermaid System Diagram](./stageport_directors_chair.mmd)
- [Notion Template](./stageport_notion_master_template.md)
- [CTDL Schema](./stagecred_ctdl_template.json)
- [Faculty Page Implementation](./FACULTY_PAGE_IMPLEMENTATION.md)
- [Component Map](./component_map.mmd)

## Understanding Scattered Components

### The Challenge
StagePort's components are distributed across multiple systems:
- **Documentation** (this repo): Architecture guides, templates, schemas
- **Notion**: Operational databases and views (CRM, Projects, Credentials)
- **Future Repositories**: API services, portal frontends, credential engines
- **External Services**: Stripe, Vercel, GitHub

### The Solution
This documentation suite provides:

1. **Architecture Overview** (this file)
   - Explains what each component does
   - Shows how components relate to each other
   - Documents data flows between systems

2. **Component Map** ([component_map.mmd](./component_map.mmd))
   - Visual diagram showing which components belong to which repository
   - Shows dependencies and integrations
   - Color-coded by system type

3. **Implementation Guides** (e.g., [FACULTY_PAGE_IMPLEMENTATION.md](./FACULTY_PAGE_IMPLEMENTATION.md))
   - Detailed specifications for building specific components
   - Code examples and file structures
   - API endpoint definitions
   - Testing strategies

### Finding What You Need

| I want to... | Look at... |
|-------------|-----------|
| Understand the overall system | This README + [System Diagram](./stageport_directors_chair.mmd) |
| See where components live | [Component Map](./component_map.mmd) |
| Set up Notion databases | [Notion Template](./stageport_notion_master_template.md) |
| Build the Faculty Page | [Faculty Page Implementation](./FACULTY_PAGE_IMPLEMENTATION.md) |
| Issue credentials | [CTDL Schema](./stagecred_ctdl_template.json) + System Arc section above |
| Understand data flow | "Data Flow Examples" section above |

### Repository Organization Strategy

**Current State:**
- Documentation and templates are centralized in `docs/stageport/`
- Implementation will be split into focused repositories

**Recommended Future Structure:**
```
gemini-cli/docs/stageport/           (Documentation - exists now)
stageport-api/                       (Backend API - to be created)
stageport-portal/                    (Web frontend - to be created)
stagecred-engine/                    (Credential processing - to be created)
```

Each repository should:
1. Reference this documentation in its README
2. Maintain its own component-specific docs
3. Document its API contracts and interfaces
4. Include integration test examples

## Support

For questions about StagePort architecture or implementation:
- Start with the [INDEX.md](./INDEX.md) to find the right documentation
- Review the relevant sections in this guide
- Check the specific implementation guides (e.g., FACULTY_PAGE_IMPLEMENTATION.md)
- Create an issue in the repository with the "stageport" label for questions not covered here
