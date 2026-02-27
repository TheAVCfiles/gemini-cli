import Link from 'next/link';

export default function PortalFooter() {
  return (
    <footer style={{ marginTop: 48, borderTop: '1px solid #d4d8e5', background: '#fff' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '18px 24px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Link href="/kinetic-ledger">Kinetic Ledger</Link>
        <Link href="/founderos/sandbox">FounderOS</Link>
        <Link href="/app/contracts">Contracts</Link>
        <Link href="/app/governance">Governance</Link>
        <Link href="/app/ledger">Ledger</Link>
      </div>
    </footer>
  );
}
