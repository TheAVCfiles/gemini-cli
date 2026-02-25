import type { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'Inter, Arial, sans-serif', margin: 0, background: '#f6f7fb' }}>
        {children}
      </body>
    </html>
  );
}
