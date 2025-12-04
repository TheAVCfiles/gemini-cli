# StagePort Faculty Page Implementation Guide

**Component:** `StageportFacultyPage.jsx`
**Purpose:** Faculty management interface with credential tracking and project assignments
**Status:** Specification (Not Yet Implemented)

## Overview

The Faculty Page is a dedicated interface within the StagePort portal for managing faculty members, their credentials, and project assignments. This guide provides specifications for implementing this component across different repositories.

## Component Location

### Repository Structure
```
stageport-portal/                    (To be created)
├── src/
│   ├── pages/
│   │   └── StageportFacultyPage.jsx    ← Main faculty page
│   ├── components/
│   │   ├── faculty/
│   │   │   ├── FacultyList.jsx         ← Faculty list view
│   │   │   ├── FacultyCard.jsx         ← Individual faculty card
│   │   │   ├── FacultyFilters.jsx      ← Filter controls
│   │   │   └── FacultySearch.jsx       ← Search functionality
│   │   ├── credentials/
│   │   │   ├── CredentialBadges.jsx    ← Badge display
│   │   │   ├── CredentialLevel.jsx     ← Level indicator
│   │   │   └── CredentialProgress.jsx  ← Progress tracking
│   │   └── projects/
│   │       ├── ProjectAssignments.jsx  ← Project list
│   │       ├── ProjectCard.jsx         ← Project details
│   │       └── AssignmentStatus.jsx    ← Status indicators
│   ├── hooks/
│   │   ├── useFacultyData.js           ← Faculty data hook
│   │   ├── useCredentials.js           ← Credentials data hook
│   │   └── useProjects.js              ← Projects data hook
│   └── services/
│       └── api.js                       ← API client
```

## Component Specifications

### 1. StageportFacultyPage.jsx (Main Container)

```jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FacultyList } from '../components/faculty/FacultyList';
import { FacultyFilters } from '../components/faculty/FacultyFilters';
import { FacultySearch } from '../components/faculty/FacultySearch';
import { useFacultyData } from '../hooks/useFacultyData';

export function StageportFacultyPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    credentialLevel: 'all', // 'all', 'bronze', 'silver', 'gold'
    status: 'active',       // 'all', 'active', 'prospect', 'alumni'
    studio: 'all'
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const { faculty, loading, error, refetch } = useFacultyData(filters, searchQuery);

  return (
    <div className="faculty-page">
      <header className="page-header">
        <h1>Faculty Management</h1>
        <button onClick={() => navigate('/faculty/new')}>
          Add Faculty Member
        </button>
      </header>

      <div className="faculty-controls">
        <FacultySearch 
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by name, email, or studio..."
        />
        <FacultyFilters 
          filters={filters}
          onChange={setFilters}
        />
      </div>

      <div className="faculty-content">
        {loading && <LoadingSpinner />}
        {error && <ErrorMessage error={error} onRetry={refetch} />}
        {!loading && !error && (
          <FacultyList 
            faculty={faculty}
            groupBy={filters.credentialLevel !== 'all' ? null : 'credentialLevel'}
            onUpdate={refetch}
          />
        )}
      </div>
    </div>
  );
}
```

### 2. FacultyList.jsx (List View)

```jsx
import React from 'react';
import { FacultyCard } from './FacultyCard';

export function FacultyList({ faculty, groupBy, onUpdate }) {
  if (groupBy === 'credentialLevel') {
    const grouped = {
      gold: faculty.filter(f => f.credentialLevel === 'gold'),
      silver: faculty.filter(f => f.credentialLevel === 'silver'),
      bronze: faculty.filter(f => f.credentialLevel === 'bronze'),
      none: faculty.filter(f => !f.credentialLevel || f.credentialLevel === 'none')
    };

    return (
      <div className="faculty-list-grouped">
        {Object.entries(grouped).map(([level, members]) => (
          members.length > 0 && (
            <section key={level} className="credential-group">
              <h2>{level.charAt(0).toUpperCase() + level.slice(1)} Level</h2>
              <div className="faculty-grid">
                {members.map(faculty => (
                  <FacultyCard 
                    key={faculty.id}
                    faculty={faculty}
                    onUpdate={onUpdate}
                  />
                ))}
              </div>
            </section>
          )
        ))}
      </div>
    );
  }

  return (
    <div className="faculty-list">
      <div className="faculty-grid">
        {faculty.map(f => (
          <FacultyCard 
            key={f.id}
            faculty={f}
            onUpdate={onUpdate}
          />
        ))}
      </div>
    </div>
  );
}
```

### 3. FacultyCard.jsx (Individual Faculty)

```jsx
import React from 'react';
import { CredentialBadges } from '../credentials/CredentialBadges';
import { ProjectAssignments } from '../projects/ProjectAssignments';

export function FacultyCard({ faculty, onUpdate }) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <article className="faculty-card">
      <div className="faculty-header" onClick={() => setExpanded(!expanded)}>
        <div className="faculty-avatar">
          {faculty.name.charAt(0).toUpperCase()}
        </div>
        <div className="faculty-info">
          <h3>{faculty.name}</h3>
          <p className="faculty-studio">{faculty.studio}</p>
          <p className="faculty-contact">{faculty.email}</p>
        </div>
        <div className="faculty-badges">
          <CredentialBadges 
            credentials={faculty.credentials}
            compact={!expanded}
          />
        </div>
      </div>

      {expanded && (
        <div className="faculty-details">
          <section className="faculty-section">
            <h4>Contact Information</h4>
            <dl>
              <dt>Email:</dt>
              <dd><a href={`mailto:${faculty.email}`}>{faculty.email}</a></dd>
              <dt>Phone:</dt>
              <dd><a href={`tel:${faculty.phone}`}>{faculty.phone}</a></dd>
              <dt>Status:</dt>
              <dd><span className={`status-badge status-${faculty.status}`}>
                {faculty.status}
              </span></dd>
            </dl>
          </section>

          <section className="faculty-section">
            <h4>Credentials</h4>
            <CredentialBadges 
              credentials={faculty.credentials}
              detailed={true}
            />
          </section>

          <section className="faculty-section">
            <h4>Active Projects ({faculty.projects?.length || 0})</h4>
            <ProjectAssignments 
              projects={faculty.projects}
              facultyId={faculty.id}
            />
          </section>

          <section className="faculty-section">
            <h4>Tags</h4>
            <div className="tag-list">
              {faculty.tags?.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          </section>
        </div>
      )}
    </article>
  );
}
```

### 4. CredentialBadges.jsx (Badge Display)

```jsx
import React from 'react';

const LEVEL_COLORS = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700'
};

const LEVEL_ICONS = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇'
};

export function CredentialBadges({ credentials, compact, detailed }) {
  if (!credentials || credentials.length === 0) {
    return <p className="no-credentials">No credentials yet</p>;
  }

  if (compact) {
    // Just show level icons
    const levels = new Set(
      credentials
        .map(c => c.level)
        .filter(level => level != null)
    );
    return (
      <div className="credential-badges-compact">
        {Array.from(levels).map(level => (
          <span 
            key={level}
            className="credential-icon"
            title={`${level} credential`}
          >
            {LEVEL_ICONS[level]}
          </span>
        ))}
      </div>
    );
  }

  if (detailed) {
    // Show full credential details
    return (
      <div className="credential-badges-detailed">
        {credentials.map(cred => (
          <article key={cred.id} className="credential-detail">
            <div 
              className="credential-badge"
              style={{ borderColor: LEVEL_COLORS[cred.level] }}
            >
              <span className="credential-icon">{LEVEL_ICONS[cred.level]}</span>
              <h5>{cred.name}</h5>
            </div>
            <dl className="credential-meta">
              <dt>Issued:</dt>
              <dd>{cred.issuedOn ? new Date(cred.issuedOn).toLocaleDateString() : 'N/A'}</dd>
              {cred.ctid && (
                <>
                  <dt>CTID:</dt>
                  <dd><code>{cred.ctid}</code></dd>
                </>
              )}
              {cred.evidenceHash && (
                <>
                  <dt>Proof:</dt>
                  <dd><code className="hash">{cred.evidenceHash.slice(0, 12)}...</code></dd>
                </>
              )}
            </dl>
          </article>
        ))}
      </div>
    );
  }

  // Default: show badge list
  return (
    <div className="credential-badges">
      {credentials.map(cred => (
        <span 
          key={cred.id}
          className="credential-badge"
          style={{ borderColor: LEVEL_COLORS[cred.level] }}
          title={`${cred.name} (${cred.level})`}
        >
          {LEVEL_ICONS[cred.level]}
        </span>
      ))}
    </div>
  );
}
```

### 5. ProjectAssignments.jsx (Project List)

```jsx
import React from 'react';
import { ProjectCard } from './ProjectCard';
import { useProjects } from '../../hooks/useProjects';

export function ProjectAssignments({ projects, facultyId }) {
  const { projects: fullProjects, loading } = useProjects({ 
    facultyId,
    status: 'active' 
  });

  if (loading) {
    return <p>Loading projects...</p>;
  }

  if (!fullProjects || fullProjects.length === 0) {
    return <p className="no-projects">No active projects</p>;
  }

  return (
    <div className="project-assignments">
      {fullProjects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
```

## Data Hooks

### useFacultyData.js

```javascript
import { useState, useEffect } from 'react';
import { api } from '../services/api';

export function useFacultyData(filters, searchQuery) {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        role: 'Faculty',
        ...filters,
        search: searchQuery
      });

      const response = await api.get(`/api/people?${params}`);
      setFaculty(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, [filters, searchQuery]);

  return {
    faculty,
    loading,
    error,
    refetch: fetchFaculty
  };
}
```

## API Endpoints Required

### GET /api/people
**Query Parameters:**
- `role` - Filter by role (e.g., "Faculty")
- `credentialLevel` - Filter by credential level
- `status` - Filter by status
- `studio` - Filter by studio
- `search` - Search query

**Response:**
```json
{
  "data": [
    {
      "id": "person_123",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "phone": "+1-555-0123",
      "role": "Faculty",
      "status": "active",
      "studio": "Main Studio",
      "credentialLevel": "gold",
      "tags": ["Ballet", "Modern", "Choreography"],
      "consentOnFile": true,
      "credentials": [
        {
          "id": "cred_456",
          "name": "Stage Cred — Gold",
          "level": "gold",
          "ctid": "ce-unique-id-123",
          "issuedOn": "2024-06-15T00:00:00Z",
          "evidenceHash": "abc123..."
        }
      ],
      "projects": [
        {
          "id": "proj_789",
          "title": "Summer Ballet Intensive",
          "type": "Class",
          "stage": "Live"
        }
      ]
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "perPage": 20
  }
}
```

## Styling Guidelines

### CSS Variables
```css
:root {
  --faculty-card-bg: #ffffff;
  --faculty-card-border: #e0e0e0;
  --faculty-card-hover: #f5f5f5;
  
  --credential-bronze: #cd7f32;
  --credential-silver: #c0c0c0;
  --credential-gold: #ffd700;
  
  --status-active: #4caf50;
  --status-prospect: #2196f3;
  --status-alumni: #9e9e9e;
}
```

### Responsive Breakpoints
- Mobile: < 768px (single column)
- Tablet: 768px - 1024px (two columns)
- Desktop: > 1024px (three columns)

## Implementation Checklist

### Phase 1: Basic Structure
- [ ] Create repository: `stageport-portal`
- [ ] Set up Next.js/React project
- [ ] Create folder structure
- [ ] Implement API client
- [ ] Add authentication

### Phase 2: Faculty Page
- [ ] Implement `StageportFacultyPage.jsx`
- [ ] Create `useFacultyData` hook
- [ ] Add search functionality
- [ ] Add filter controls
- [ ] Implement loading states
- [ ] Add error handling

### Phase 3: Faculty Components
- [ ] Build `FacultyList` component
- [ ] Build `FacultyCard` component
- [ ] Implement expand/collapse
- [ ] Add credential display
- [ ] Add project assignments
- [ ] Add contact information

### Phase 4: Credentials & Projects
- [ ] Create `CredentialBadges` component
- [ ] Implement badge levels (bronze, silver, gold)
- [ ] Create `ProjectAssignments` component
- [ ] Link to project details pages
- [ ] Add CTID verification links

### Phase 5: Polish
- [ ] Add responsive styling
- [ ] Implement accessibility (ARIA labels, keyboard nav)
- [ ] Add loading animations
- [ ] Optimize performance
- [ ] Write unit tests
- [ ] Write integration tests

## Testing Strategy

### Unit Tests
```javascript
// FacultyCard.test.jsx
import { render, screen } from '@testing-library/react';
import { FacultyCard } from './FacultyCard';

test('displays faculty name and email', () => {
  const faculty = {
    id: '1',
    name: 'Jane Doe',
    email: 'jane@example.com',
    credentials: []
  };
  
  render(<FacultyCard faculty={faculty} />);
  
  expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  expect(screen.getByText('jane@example.com')).toBeInTheDocument();
});
```

### Integration Tests
- Test search functionality with API mocking
- Test filter combinations
- Test credential badge display
- Test project assignment loading

## Migration from Notion

If currently using Notion's Faculty Panel view:

1. **Data Export**: Export People database filtered by Role=Faculty
2. **API Integration**: Connect Notion API or migrate to custom database
3. **Gradual Migration**: Run both systems in parallel during transition
4. **Data Validation**: Verify all credentials and projects are linked correctly

## Related Documentation

- [StagePort Architecture Guide](./README.md)
- [Component Map](./component_map.mmd)
- [System Diagram](./stageport_directors_chair.mmd)
- [Notion Template](./stageport_notion_master_template.md)

## Next Steps

1. Review this specification with stakeholders
2. Set up the `stageport-portal` repository
3. Implement API endpoints in `stageport-api`
4. Build components iteratively starting with Phase 1
5. Test with real faculty data from Notion
