import { Navigation } from '@/components/landing/Navigation';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { CTASection } from '@/components/landing/CTASection';
import { Footer } from '@/components/landing/Footer';
import { JsonLd } from '@/components/seo/JsonLd';

import { NEXT_PUBLIC_APP_NAME } from '@/lib/env';
import { SEO_DESCRIPTION } from '@/lib/seo-constants';

export default function Home() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: NEXT_PUBLIC_APP_NAME,
    operatingSystem: 'Web',
    applicationCategory: 'BusinessApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: SEO_DESCRIPTION,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '120',
    },
  };

  const orgData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: NEXT_PUBLIC_APP_NAME,
    url: 'https://internode.vercel.app',
    logo: 'https://internode.vercel.app/icon.svg',
    sameAs: [
      `https://twitter.com/${NEXT_PUBLIC_APP_NAME.toLowerCase()}`,
      'https://github.com/adi-uchiha/internode',
      `https://linkedin.com/company/${NEXT_PUBLIC_APP_NAME.toLowerCase()}`,
    ],
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <JsonLd data={structuredData} />
      <JsonLd data={orgData} />
      <Navigation />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
