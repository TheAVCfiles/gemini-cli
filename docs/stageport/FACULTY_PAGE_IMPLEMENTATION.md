# StagePort Faculty Page Implementation

This spec turns the architecture narrative into a build-ready contract for `StageportFacultyPage.jsx` and its children.

## Component hierarchy

```
StageportFacultyPage
  ├─ FacultyFilters (search, credential level, assignment)
  ├─ FacultyList
  │    └─ FacultyCard
  │         ├─ CredentialBadges
  │         └─ ProjectAssignments
  └─ Telemetry hooks (page view, filter usage)
```

## Domain types (pseudo-TypeScript)

```ts
type CredentialLevel = 'MASTER' | 'APPRENTICE' | 'STUDENT' | 'NEEDS_FOUNDATION';

type Credential = {
  id: string;
  label: string;
  issuedOn?: string;
  issuer?: string;
};

type ProjectAssignment = {
  id: string;
  title: string;
  role: string;
  status: 'ACTIVE' | 'PAUSED' | 'ALUMNI';
};

interface FacultyFilters {
  credentialLevels?: CredentialLevel[];
  assignments?: string[];
}

interface FacultyMember {
  id: string;
  name: string;
  credentialLevel: CredentialLevel;
  credentials: Credential[];
  projects: ProjectAssignment[];
  avatarUrl?: string;
  bio?: string;
}

interface StageportFacultyPageProps {
  defaultFilters?: FacultyFilters;
  initialSearchQuery?: string;
}
```

## Container contract

```tsx
export function StageportFacultyPage({
  defaultFilters,
  initialSearchQuery,
}: StageportFacultyPageProps) {
  const [filters, setFilters] = useState<FacultyFilters>(defaultFilters ?? {});
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery ?? '');

  const { faculty, loading, error } = useFacultyData({ filters, searchQuery });

  if (loading) return <FacultySkeletonGrid />;
  if (error)
    return (
      <ErrorState message="Unable to load faculty." onRetry={refetchFaculty} />
    );
  if (!faculty.length)
    return <EmptyState message="No faculty match your filters yet." />;

  return (
    <FacultyList
      faculty={faculty}
      groupBy="credentialLevel"
      onSelectAssignment={(assignmentId) =>
        setFilters((prev) => ({ ...prev, assignments: [assignmentId] }))
      }
      onSelectCredentialLevel={(credentialLevel) =>
        setFilters((prev) => ({ ...prev, credentialLevels: [credentialLevel] }))
      }
    />
  );
}
```

> **State ownership:** Filters and search are local state in the container. Surface them as props only if another route needs to control them.

## Child component responsibilities

- **FacultyFilters:** Presents search input and dropdowns. Emits `onChange` to update filters and search query.
- **FacultyList:** Accepts an array of `FacultyMember` objects and optional grouping key. Owns layout (grid/list) and delegates rendering to `FacultyCard`.
- **FacultyCard:** Renders profile, avatar, bio, and stacked sections for credentials and project assignments.
- **CredentialBadges:** Displays credential chips, sorted by level, with accessible labels.
- **ProjectAssignments:** Shows current and past projects with status tags.
- **Telemetry hooks:** Track page views, filter interactions, and card clicks; noop or console during mock-data phase.

## Loading, empty, and error states

- **Loading:** Skeleton grid matching card dimensions (`FacultySkeletonGrid`).
- **Error:** Bounded alert with retry affordance; keep the page chrome visible.
- **Empty:** Friendly zero-state message plus a reset-filters button.

## Notion integration and adapter

- **Source of truth:** Notion database **StagePort Faculty**. The web Faculty Page is a read-only view of that table via a typed API adapter.
- **Adapter seam:** `NotionFacultyRecord -> FacultyMember` with field normalization (IDs, enum mapping, URL validation).
- **API client:** Expose `GET /faculty?credentialLevels=&assignments=&q=` from `stageport-server` (future), returning `FacultyMember[]` shaped by the adapter.
- **Mock path:** During scaffolding, back `useFacultyData` with a static JSON file that mirrors the domain types above.

## Hook sketch (`useFacultyData`)

```ts
function useFacultyData({
  filters,
  searchQuery,
}: {
  filters: FacultyFilters;
  searchQuery: string;
}) {
  const [state, setState] = useState<{
    faculty: FacultyMember[];
    loading: boolean;
    error?: Error;
  }>({
    faculty: [],
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: undefined }));

    fetchFaculty({ filters, searchQuery })
      .then((faculty) => !cancelled && setState({ faculty, loading: false }))
      .catch(
        (error) =>
          !cancelled && setState({ faculty: [], loading: false, error }),
      );

    return () => {
      cancelled = true;
    };
  }, [filters, searchQuery]);

  return {
    ...state,
    refetchFaculty: () => fetchFaculty({ filters, searchQuery }),
  };
}
```

## Testing notes

- **Unit:** Render `StageportFacultyPage` with mock data to cover loading, empty, and error states.
- **Contract:** Validate adapter transformations with fixtures that mirror Notion payloads.
- **Integration (later):** Wire against the read-only API once the server layer exists.
