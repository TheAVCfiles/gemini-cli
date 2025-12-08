import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MythOS Host',
  description: 'Self-hosted Next.js + FastAPI starter served by Caddy.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
