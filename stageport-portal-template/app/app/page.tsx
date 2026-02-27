import Link from 'next/link';
import { getCurrentProfile } from '../../lib/auth';
import { canViewRoute } from '../../lib/rbac';
import PortalNavigation from '../../components/PortalNavigation';
import PortalFooter from '../../components/PortalFooter';

const routes = [
  { href: '/kinetic-ledger', label: 'Kinetic Ledger' },
  { href: '/founderos/sandbox', label: 'FounderOS' },
  { href: '/app/founder', label: 'Founder Dashboard' },
  { href: '/app/sessions', label: 'Sessions' },
  { href: '/app/ledger', label: 'Ledger' },
  { href: '/app/contracts', label: 'Contracts' },
  { href: '/app/governance', label: 'Governance' },
];

export default async function DashboardPage() {
  const profile = await getCurrentProfile();

  return (
    <>
      <PortalNavigation />
      <main style={{ maxWidth: 900, margin: '40px auto', padding: 24 }}>
        <h1>Dashboard</h1>
        <p>
          Signed in as <strong>{profile.email}</strong> ({profile.role})
        </p>

        <ul>
          {routes
            .filter((route) => route.href.startsWith('/kinetic-ledger') || route.href.startsWith('/founderos') || canViewRoute(profile.role, route.href))
            .map((route) => (
              <li key={route.href}>
                <Link href={route.href}>{route.label}</Link>
              </li>
            ))}
        </ul>
      </main>
      <PortalFooter />
    </>
  );
}
