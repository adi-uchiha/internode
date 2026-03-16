import { Navigation } from '@/components/landing/Navigation';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { CTASection } from '@/components/landing/CTASection';
import { Footer } from '@/components/landing/Footer';
import { JsonLd } from '@/components/seo/JsonLd';

export default function Home() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Internode',
    operatingSystem: 'Web',
    applicationCategory: 'BusinessApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description:
      'High-performance project management platform designed for engineering teams who demand precision, speed, and reliability.',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '120',
    },
  };

  const orgData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Internode',
    url: 'https://internode.app',
    logo: 'https://internode.app/icon.svg',
    sameAs: [
      'https://twitter.com/internode',
      'https://github.com/adi-uchiha/internode',
      'https://linkedin.com/company/internode',
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
