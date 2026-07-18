import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TraderOS — The Operating System for Traders',
  description:
    'TraderOS is the complete operating system for traders. Plan, execute, journal, analyze, and improve — all in one intelligent ecosystem.',
  openGraph: {
    title: 'TraderOS',
    description: 'The complete operating system for traders.',
    images: [{ url: 'https://bolt.new/static/og_default.png' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen`}>{children}</body>
    </html>
  );
}
