import Link from 'next/link';

const columns = [
  {
    heading: 'TOOLS',
    items: [
      { href: '/kinetic-ledger', label: 'Kinetic Ledger' },
      { href: '/founderos/sandbox', label: 'FounderOS Sandbox' },
    ],
  },
  {
    heading: 'PLATFORM',
    items: [
      { href: '/app/sessions', label: 'Product' },
      { href: '/app/founder/onboarding', label: 'Pricing' },
      { href: '/app/founder', label: 'StudiOS' },
    ],
  },
  {
    heading: 'GOVERNANCE',
    items: [
      { href: '/app/contracts', label: 'Contracts' },
      { href: '/app/ledger', label: 'Tokens' },
      { href: '/app/governance', label: 'Governance' },
    ],
  },
];

export default function PortalFooter() {
  return (
    <footer style={{ marginTop: 64, borderTop: '1px solid #d4d8e5', background: '#fff' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px', display: 'grid', gap: 24, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        {columns.map((column) => (
          <div key={column.heading}>
            <p style={{ marginTop: 0, marginBottom: 10, fontSize: 11, letterSpacing: '0.1em', color: '#667085' }}>{column.heading}</p>
            <div style={{ display: 'grid', gap: 8 }}>
              {column.items.map((item) => (
                <Link key={`${column.heading}-${item.href}`} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </footer>
  );
}
