'use client';

import Link from 'next/link';
import { useState } from 'react';

const CONTACT_EMAIL = 'guidedtarotpeutics@gmail.com';

type NavItem = { href: string; label: string };
type NavGroup = { label: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    label: 'TOOLS',
    items: [
      { href: '/kinetic-ledger', label: 'Kinetic Ledger' },
      { href: '/founderos/sandbox', label: 'FounderOS Sandbox' },
    ],
  },
  {
    label: 'PLATFORM',
    items: [
      { href: '/app/sessions', label: 'Product' },
      { href: '/app/founder/onboarding', label: 'Pricing' },
      { href: '/app/founder', label: 'StudiOS' },
    ],
  },
  {
    label: 'GOVERNANCE',
    items: [
      { href: '/app/contracts', label: 'Contracts' },
      { href: '/app/sessions', label: 'Faculty' },
      { href: '/app/ledger', label: 'Tokens' },
      { href: '/app/governance', label: 'Governance' },
    ],
  },
];

export default function PortalNavigation() {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header style={{ borderBottom: '1px solid #d4d8e5', background: 'rgba(255,255,255,0.96)', position: 'sticky', top: 0, zIndex: 40 }}>
      <nav style={{ maxWidth: 1180, margin: '0 auto', padding: '14px 24px' }}>
        <div className="top-row">
          <div className="desktop-nav">
            {navGroups.map((group, index) => (
              <div
                key={group.label}
                className="nav-group"
                style={{ paddingRight: index < navGroups.length - 1 ? 20 : 0, borderRight: index < navGroups.length - 1 ? '1px solid rgba(33,41,66,0.16)' : 'none' }}
                onMouseEnter={() => setOpenGroup(group.label)}
                onMouseLeave={() => setOpenGroup((current) => (current === group.label ? null : current))}
              >
                <button
                  onClick={() => setOpenGroup((current) => (current === group.label ? null : group.label))}
                  style={{ fontSize: 12, letterSpacing: '0.1em', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  {group.label}
                </button>
                {openGroup === group.label && (
                  <div className="dropdown-panel">
                    <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.11em', color: '#667085' }}>{group.label}</p>
                    <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
                      {group.items.map((item) => (
                        <Link key={item.href + item.label} href={item.href} style={{ fontSize: 14, textDecoration: 'none', color: '#111827' }}>
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            <Link href="/app/ledger" style={{ fontSize: 12, letterSpacing: '0.1em', textDecoration: 'none' }}>
              R&amp;D
            </Link>
          </div>

          <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Book a Call — StagePort')}`} className="book-call">
            BOOK A CALL
          </a>

          <button onClick={() => setMobileOpen((prev) => !prev)} className="mobile-toggle" aria-expanded={mobileOpen}>
            MENU
          </button>
        </div>

        {mobileOpen && (
          <div className="mobile-panel">
            {navGroups.map((group) => (
              <div key={`mobile-${group.label}`} style={{ marginBottom: 14 }}>
                <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.1em', color: '#667085' }}>{group.label}</p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 6 }}>
                  {group.items.map((item) => (
                    <Link key={`mobile-${item.href}-${item.label}`} href={item.href} style={{ fontSize: 13, textDecoration: 'none' }}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ borderTop: '1px solid rgba(33,41,66,0.12)', paddingTop: 10, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/app/ledger" style={{ fontSize: 13, textDecoration: 'none' }}>R&amp;D</Link>
            </div>
          </div>
        )}
      </nav>
      <style jsx>{`
        .top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }
        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 40px;
          flex-wrap: wrap;
        }
        .nav-group {
          position: relative;
        }
        .dropdown-panel {
          position: absolute;
          top: calc(100% + 10px);
          left: 0;
          min-width: 220px;
          border: 1px solid rgba(33, 41, 66, 0.12);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(10px);
          box-shadow: 0 10px 30px rgba(16, 24, 40, 0.08);
          padding: 14px;
        }
        .book-call {
          font-size: 12px;
          letter-spacing: 0.1em;
          text-decoration: none;
          border: 1px solid #111827;
          border-radius: 999px;
          padding: 8px 14px;
        }
        .mobile-toggle,
        .mobile-panel {
          display: none;
        }

        @media (max-width: 900px) {
          .desktop-nav,
          .book-call {
            display: none;
          }
          .mobile-toggle {
            display: inline-flex;
            border: 1px solid #111827;
            border-radius: 999px;
            background: transparent;
            padding: 8px 12px;
            letter-spacing: 0.1em;
            font-size: 11px;
          }
          .mobile-panel {
            margin-top: 14px;
            border-top: 1px solid rgba(33, 41, 66, 0.12);
            padding-top: 14px;
            display: block;
          }
        }
      `}</style>
    </header>
  );
}
