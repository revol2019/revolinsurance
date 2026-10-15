import type { Metadata } from 'next';
import { Archivo, Figtree } from 'next/font/google';
import './globals.css';

const display = Archivo({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const body = Figtree({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://revolinsurance.com'),
  title: {
    default: 'REVOL Insurance — Independent insurance in Maryland, DC and Virginia',
    template: '%s · REVOL Insurance',
  },
  description:
    'An independent insurance agency serving Maryland, DC, Virginia, Delaware and Pennsylvania. Home, auto, business, life and Medicare — shopped across our appointed carriers.',
  openGraph: {
    type: 'website',
    siteName: 'REVOL Insurance',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover' as const,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
