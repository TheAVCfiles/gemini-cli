# StagePort Documentation Index

Welcome to the StagePort documentation! This index helps you quickly find the right documentation for your needs.

## 📚 Documentation Files

### 1. [README.md](./README.md) - START HERE
**The main architecture guide**

What you'll find:
- Complete system overview
- Detailed description of all 7 architectural arcs
- Data flow examples
- Component relationships
- Implementation roadmap
- FAQs about scattered components

**Best for:** Understanding the entire system, getting oriented, finding answers to "how does X relate to Y?"

---

### 2. [component_map.mmd](./component_map.mmd)
**Visual component organization diagram**

What you'll find:
- Color-coded diagram showing which components belong to which repository
- Data flow arrows between components
- Integration points with external services
- Clear separation between documentation, databases, APIs, and frontends

**Best for:** Visual learners, understanding repository structure, seeing the big picture

**How to view:** 
- Copy contents and paste into [Mermaid Live Editor](https://mermaid.live/)
- View on GitHub (automatic rendering)
- Use any Markdown viewer with Mermaid support

---

### 3. [stageport_directors_chair.mmd](./stageport_directors_chair.mmd)
**Original system architecture diagram**

What you'll find:
- High-level system flows
- The 7 architectural arcs visualized
- Relationships between major subsystems
- External system integrations

**Best for:** Executive overview, stakeholder presentations, understanding system boundaries

---

### 4. [FACULTY_PAGE_IMPLEMENTATION.md](./FACULTY_PAGE_IMPLEMENTATION.md)
**Detailed implementation guide for Faculty Page component**

What you'll find:
- Complete component specifications with React code examples
- Repository and folder structure
- Component hierarchy (`StageportFacultyPage` → `FacultyList` → `FacultyCard`, etc.)
- Data hooks implementation
- API endpoint definitions
- Styling guidelines
- Testing strategy
- Migration guide from Notion

**Best for:** Developers building the Faculty Page, understanding React component patterns, API contract design

---

### 5. [stageport_notion_master_template.md](./stageport_notion_master_template.md)
**Notion database setup guide**

What you'll find:
- Database schemas for all 7 core databases
- Property definitions and types
- Relation mappings between databases
- Dashboard view configurations
- Director's Chair panel specifications

**Best for:** Setting up Notion workspace, understanding data model, configuring views

---

### 6. [stagecred_ctdl_template.json](./stagecred_ctdl_template.json)
**Credential Transparency Description Language (CTDL) template**

What you'll find:
- JSON schema for StageCred badges
- CTDL-compliant credential format
- Evidence document structure
- Assessment profile format

**Best for:** Implementing credential issuance, understanding badge standards, building CTDL issuer

---

## 🎯 Quick Navigation by Use Case

### "I'm new and confused about all these scattered components"
1. Start with [README.md](./README.md) - read the "Overview" and "Understanding Scattered Components" sections
2. Look at [component_map.mmd](./component_map.mmd) to see visual organization
3. Review [stageport_directors_chair.mmd](./stageport_directors_chair.mmd) for system architecture

### "I need to set up the system from scratch"
1. Read [README.md](./README.md) - "Implementation Roadmap" section
2. Follow [stageport_notion_master_template.md](./stageport_notion_master_template.md) to set up databases
3. Refer to specific implementation guides as you build each component

### "I need to build the Faculty Page"
1. Read [FACULTY_PAGE_IMPLEMENTATION.md](./FACULTY_PAGE_IMPLEMENTATION.md) completely
2. Refer to [README.md](./README.md) - "Faculty Panel Component" section for context
3. Check [component_map.mmd](./component_map.mmd) to see how it fits into the larger system

### "I need to understand how data flows"
1. Read [README.md](./README.md) - "Data Flow Examples" section
2. Look at [stageport_directors_chair.mmd](./stageport_directors_chair.mmd) for visual flows
3. Check [component_map.mmd](./component_map.mmd) for detailed integration points

### "I need to issue credentials"
1. Read [README.md](./README.md) - "CTDL Badge Issuer" section
2. Review [stagecred_ctdl_template.json](./stagecred_ctdl_template.json) for schema
3. Check "Data Flow Examples" → "Example 2: Credential Issuance" in README

### "I need to explain this to stakeholders"
1. Use [stageport_directors_chair.mmd](./stageport_directors_chair.mmd) for high-level overview
2. Reference [README.md](./README.md) - "Architecture Layers" section
3. Show [component_map.mmd](./component_map.mmd) to explain repository organization

### "I need to integrate with external systems"
1. Check [README.md](./README.md) - "External Systems" subsection
2. Look at [component_map.mmd](./component_map.mmd) - "External Services" section
3. Review relevant arc documentation in README

---

## 📖 Reading Order Recommendations

### For Project Managers / Stakeholders
1. README.md (Overview, Architecture Layers)
2. stageport_directors_chair.mmd (visual)
3. README.md (Implementation Roadmap)
4. component_map.mmd (to understand repo organization)

### For Developers (Backend)
1. README.md (complete read)
2. component_map.mmd (focus on API and Engine sections)
3. stagecred_ctdl_template.json (if working on credentials)
4. Relevant implementation guides

### For Developers (Frontend)
1. README.md (complete read)
2. FACULTY_PAGE_IMPLEMENTATION.md (or other component guides)
3. component_map.mmd (focus on Portal section)
4. stageport_notion_master_template.md (to understand data model)

### For Database Administrators
1. stageport_notion_master_template.md (complete read)
2. README.md (Operational Arc, Data Flow Examples)
3. stagecred_ctdl_template.json (credential structure)

### For DevOps / Infrastructure
1. component_map.mmd (understand deployment targets)
2. README.md (External Systems, System Arc)
3. Individual component implementation guides for deployment specs

---

## 🔄 Document Relationships

```
README.md (master guide)
    ├── References → stageport_directors_chair.mmd (original diagram)
    ├── References → stageport_notion_master_template.md (database setup)
    ├── References → stagecred_ctdl_template.json (credential schema)
    ├── References → component_map.mmd (repo organization)
    └── References → FACULTY_PAGE_IMPLEMENTATION.md (detailed component spec)

component_map.mmd
    ├── Visualizes → README.md (component descriptions)
    └── Shows locations of → All implementation components

FACULTY_PAGE_IMPLEMENTATION.md
    ├── Detailed spec for → README.md (Faculty Panel section)
    ├── Implements data from → stageport_notion_master_template.md (People DB)
    └── Part of → component_map.mmd (Portal section)

stageport_notion_master_template.md
    ├── Implements → stageport_directors_chair.mmd (database structure)
    └── Data model for → All component implementations

stagecred_ctdl_template.json
    └── Used by → CTDL Issuer (System Arc)
```

---

## 🔗 External Resources

- [Mermaid Live Editor](https://mermaid.live/) - For viewing and editing .mmd files
- [Notion](https://notion.so) - Database platform for operational data
- [CTDL Specification](https://credreg.net/) - Credential standards documentation

---

## 📝 Contributing to Documentation

When adding new documentation:
1. Update this INDEX.md with a new entry
2. Add cross-references in README.md
3. Update component_map.mmd if adding new components
4. Follow the existing documentation style

---

## ❓ Still Have Questions?

1. Search this documentation using your editor's search function
2. Check the FAQs in [README.md](./README.md)
3. Create an issue in the repository with the "stageport" label

---

**Last Updated:** 2025-12-04
