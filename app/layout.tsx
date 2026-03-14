import type { Metadata } from 'next';
import { spaceGrotesk, jetBrainsMono } from '@/lib/fonts';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { AuthProvider } from '@/contexts/AuthContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { SmoothScroll } from '@/components/smooth-scroll';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Internode | Engineering-Grade Project Management',
  description:
    'Internode is the high-performance project management platform designed for engineering teams who demand precision, speed, and reliability.',
  metadataBase: process.env.VERCEL_URL
    ? new URL(`https://${process.env.VERCEL_URL}`)
    : new URL('http://localhost:3000'),
  openGraph: {
    title: 'Internode',
    description: 'Engineering-Grade Project Management Platform',
    siteName: 'Internode',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Internode - High Performance Project Management',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Internode',
    description: 'Engineering-Grade Project Management Platform',
    images: ['/og-image.png'],
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
