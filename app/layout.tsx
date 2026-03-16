import type { Metadata } from 'next';
import { spaceGrotesk, jetBrainsMono } from '@/lib/fonts';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { AuthProvider } from '@/contexts/AuthContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { SmoothScroll } from '@/components/smooth-scroll';
import { cn } from '@/lib/utils';

import { NEXT_PUBLIC_APP_NAME } from '@/lib/env';
import { SEO_KEYWORDS, SEO_DESCRIPTION, SEO_TITLE } from '@/lib/seo-constants';

export const metadata: Metadata = {
  title: `${NEXT_PUBLIC_APP_NAME} | ${SEO_TITLE}`,
  description: SEO_DESCRIPTION,
  keywords: SEO_KEYWORDS,
  authors: [{ name: `${NEXT_PUBLIC_APP_NAME} Team` }],
  creator: NEXT_PUBLIC_APP_NAME,
  publisher: NEXT_PUBLIC_APP_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  ),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: NEXT_PUBLIC_APP_NAME,
    description: 'Engineering-Grade Project Management Platform',
    siteName: NEXT_PUBLIC_APP_NAME,
    url: 'https://internode.vercel.app',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: `${NEXT_PUBLIC_APP_NAME} - High Performance Project Management`,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: NEXT_PUBLIC_APP_NAME,
    description: 'Engineering-Grade Project Management Platform',
    images: ['/og-image.png'],
    creator: `@${NEXT_PUBLIC_APP_NAME.toLowerCase()}`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'kIcnD-AIBS4aaN6LeVB0fj4Afyp-B8gTZFSnv2wBXnw',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn('antialiased', spaceGrotesk.variable, jetBrainsMono.variable)}
    >
      <body className="bg-background text-foreground font-sans min-h-screen">
        <QueryProvider>
          <AuthProvider>
            <TooltipProvider>
              <SmoothScroll />
              {children}
              <Sonner />
            </TooltipProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
