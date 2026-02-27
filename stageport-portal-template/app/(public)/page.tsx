import Link from 'next/link';
import PortalFooter from '../../components/PortalFooter';
import PortalNavigation from '../../components/PortalNavigation';

export default function PublicLandingPage() {
  return (
    <>
      <PortalNavigation />
      <main style={{ maxWidth: 780, margin: '80px auto', padding: 24 }}>
        <h1>StagePort Portal</h1>
        <p>Replit-ready starter with governance surfaces and role-based dashboards.</p>
        <p>
          <Link href="/kinetic-ledger">Open Kinetic Ledger</Link>
        </p>
        <p>
          <Link href="/founderos/sandbox">Open FounderOS Sandbox</Link>
        </p>
        <p>
          <Link href="/app">Open Dashboard</Link>
        </p>
      </main>
      <PortalFooter />
    </>
  );
}
