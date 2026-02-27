import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Kinetic Ledger — Founder Contribution Protection | Global AVC Systems',
  description:
    'Kinetic Ledger helps founders protect contribution records, anchor authorship, and export proof before diligence or conflict.',
};

export default function KineticLedgerLayout({ children }: { children: ReactNode }) {
  return children;
}
