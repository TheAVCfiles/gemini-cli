import Link from 'next/link';

const links = [
  { href: '/kinetic-ledger', label: 'KINETIC LEDGER' },
  { href: '/founderos/sandbox', label: 'FOUNDEROS' },
  { href: '/app/sessions', label: 'SESSIONS' },
  { href: '/app/ledger', label: 'LEDGER' },
  { href: '/app/contracts', label: 'CONTRACTS' },
  { href: '/app/governance', label: 'GOVERNANCE' },
];

export default function PortalNavigation() {
  return (
    <header style={{ borderBottom: '1px solid #d4d8e5', background: '#fff' }}>
      <nav style={{ maxWidth: 1100, margin: '0 auto', padding: '14px 24px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {links.map((link) => (
          <Link key={link.href} href={link.href} style={{ fontSize: 12, letterSpacing: '0.08em', textDecoration: 'none' }}>
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
