import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/auth-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { TimezoneProvider } from '@/components/timezone-provider';
import { brand } from '@/lib/brand';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: `${brand.name} — ${brand.tagline}`,
  description: brand.description,
  metadataBase: new URL(brand.url),
  openGraph: {
    title: brand.name,
    description: brand.tagline,
    images: [{ url: brand.social.ogImage }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen`}>
        <ThemeProvider>
          <TimezoneProvider>
            <AuthProvider>{children}</AuthProvider>
          </TimezoneProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
