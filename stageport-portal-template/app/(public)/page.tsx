import Link from 'next/link';

export default function PublicLandingPage() {
  return (
    <main style={{ maxWidth: 780, margin: '80px auto', padding: 24 }}>
      <h1>StagePort Portal</h1>
      <p>Replit-ready starter with Supabase auth, profiles, and role-based dashboards.</p>
      <Link href="/app">Open Dashboard</Link>
    </main>
  );
}
