import Link from 'next/link';
import { getCurrentProfile } from '../../lib/auth';
import { canViewRoute } from '../../lib/rbac';

const routes = [
  { href: '/app/sessions', label: 'Sessions' },
  { href: '/app/ledger', label: 'Ledger' },
  { href: '/app/contracts', label: 'Contracts' },
  { href: '/app/governance', label: 'Governance' }
];

export default async function DashboardPage() {
  const profile = await getCurrentProfile();

  return (
    <main style={{ maxWidth: 900, margin: '40px auto', padding: 24 }}>
      <h1>Dashboard</h1>
      <p>
        Signed in as <strong>{profile.email}</strong> ({profile.role})
      </p>

      <ul>
        {routes
          .filter((route) => canViewRoute(profile.role, route.href))
          .map((route) => (
            <li key={route.href}>
              <Link href={route.href}>{route.label}</Link>
            </li>
          ))}
      </ul>
    </main>
  );
}
