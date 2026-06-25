import { Metadata } from 'next';
import { Navigation } from '@/components/landing/Navigation';
import { Footer } from '@/components/landing/Footer';
import { FadeIn } from '@/components/landing/Animations';
import { NEXT_PUBLIC_APP_NAME } from '@/lib/env';

export const metadata: Metadata = {
  title: `Terms of Service | ${NEXT_PUBLIC_APP_NAME}`,
  description: `Terms and conditions for using ${NEXT_PUBLIC_APP_NAME}, the high-performance engineering-grade project management platform.`,
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6 max-w-4xl">
          {/* Header Section */}
          <FadeIn direction="up" className="mb-12">
            <span className="inline-block font-mono text-xs uppercase tracking-widest text-primary mb-4 px-3 py-1 border border-primary/30 bg-primary/5">
              [SYSTEM_LEGAL_DOC_v1.0]
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-light leading-tight mb-4">
              Terms of <span className="italic text-primary">Service</span>
            </h1>
            <p className="text-sm font-mono text-muted-foreground">Last Updated: June 25, 2026</p>
          </FadeIn>

          {/* Content Block */}
          <FadeIn
            direction="up"
            delay={0.1}
            className="border border-border bg-card p-8 md:p-12 relative overflow-hidden"
          >
            <div className="absolute inset-0 dot-pattern opacity-10 pointer-events-none" />

            <div className="relative space-y-8 font-sans text-muted-foreground leading-relaxed">
              <section className="space-y-3">
                <h2 className="text-xl font-display font-medium text-foreground tracking-tight">
                  1. Acceptance of Terms
                </h2>
                <div className="h-px w-20 bg-primary/30 mb-4" />
                <p>
                  By accessing or using {NEXT_PUBLIC_APP_NAME} (the "Service"), you agree to be
                  bound by these Terms of Service (the "Terms"). If you do not agree to these Terms,
                  please do not access or use our Service. These Terms apply to all visitors, users,
                  and others who access or use the Service.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-display font-medium text-foreground tracking-tight">
                  2. Description of Service
                </h2>
                <div className="h-px w-20 bg-primary/30 mb-4" />
                <p>
                  {NEXT_PUBLIC_APP_NAME} provides high-performance project management infrastructure
                  optimized for engineering teams. The Service includes task tracking, board views,
                  velocity analytics, integration options, and team coordination utilities. We
                  reserve the right to modify, suspend, or discontinue any aspect of the Service at
                  any time.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-display font-medium text-foreground tracking-tight">
                  3. Subscription Plans and Billing
                </h2>
                <div className="h-px w-20 bg-primary/30 mb-4" />
                <p>We offer various tiers of access to our Service:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong className="text-foreground">Starter Free:</strong> A free-of-charge
                    subscription tier with limitations on active projects, active interns, and
                    organizations.
                  </li>
                  <li>
                    <strong className="text-foreground">Pro Growth ($29/month):</strong> Designed
                    for scaling engineering teams, offering increased limits, advanced velocity
                    analytics, AI weekly summaries, and priority support.
                  </li>
                  <li>
                    <strong className="text-foreground">Enterprise ($99/month):</strong> Designed
                    for large agencies, offering unlimited resources, custom integrations, dedicated
                    support channels, and SLA/compliance guarantees.
                  </li>
                </ul>
                <p>
                  Billing is processed on a recurring monthly basis. All payment transactions,
                  invoicing, and subscription adjustments are managed securely via our payment
                  processor, Lemon Squeezy. You agree to provide accurate and complete billing
                  information.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-display font-medium text-foreground tracking-tight">
                  4. User Accounts and Security
                </h2>
                <div className="h-px w-20 bg-primary/30 mb-4" />
                <p>
                  To access key features of the Service, you must create an account. You are
                  responsible for safeguarding your account details, credentials, and third-party
                  authentication profiles. You agree to notify us immediately of any unauthorized
                  use or breach of security. {NEXT_PUBLIC_APP_NAME} will not be liable for losses
                  caused by any unauthorized use of your account.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-display font-medium text-foreground tracking-tight">
                  5. Acceptable Use and Restrictions
                </h2>
                <div className="h-px w-20 bg-primary/30 mb-4" />
                <p>You agree not to engage in any of the following prohibited activities:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Copying, distributing, or disclosing any part of the Service in any medium.
                  </li>
                  <li>
                    Using any automated system, including "robots," "spiders," or "offline readers"
                    to access the Service in a manner that sends more request messages to our
                    servers than a human can reasonably produce.
                  </li>
                  <li>
                    Attempting to interfere with, compromise the system integrity or security, or
                    decipher any transmissions to or from the servers running the Service.
                  </li>
                  <li>
                    Taking any action that imposes, or may impose at our sole discretion an
                    unreasonable or disproportionately large load on our infrastructure.
                  </li>
                  <li>Using the Service for any unlawful or unauthorized commercial purposes.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-display font-medium text-foreground tracking-tight">
                  6. Intellectual Property
                </h2>
                <div className="h-px w-20 bg-primary/30 mb-4" />
                <p>
                  The Service and its original content, features, and functionality (excluding
                  user-provided content) are and will remain the exclusive property of{' '}
                  {NEXT_PUBLIC_APP_NAME} and its licensors. Our trademarks and trade dress may not
                  be used in connection with any product or service without our prior written
                  consent.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-display font-medium text-foreground tracking-tight">
                  7. Limitation of Liability
                </h2>
                <div className="h-px w-20 bg-primary/30 mb-4" />
                <p>
                  In no event shall {NEXT_PUBLIC_APP_NAME}, its directors, employees, partners,
                  agents, suppliers, or affiliates, be liable for any indirect, incidental, special,
                  consequential, or punitive damages, including without limitation, loss of profits,
                  data, use, goodwill, or other intangible losses, resulting from (i) your access to
                  or use of or inability to access or use the Service; (ii) any conduct or content
                  of any third party on the Service; or (iii) unauthorized access, use, or
                  alteration of your transmissions or content, whether based on warranty, contract,
                  tort (including negligence), or any other legal theory.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-display font-medium text-foreground tracking-tight">
                  8. Governing Law
                </h2>
                <div className="h-px w-20 bg-primary/30 mb-4" />
                <p>
                  These Terms shall be governed and construed in accordance with the laws of India,
                  without regard to its conflict of law provisions. Our failure to enforce any right
                  or provision of these Terms will not be considered a waiver of those rights.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-display font-medium text-foreground tracking-tight">
                  9. Changes to Terms
                </h2>
                <div className="h-px w-20 bg-primary/30 mb-4" />
                <p>
                  We reserve the right, at our sole discretion, to modify or replace these Terms at
                  any time. If a revision is material, we will provide at least 30 days' notice
                  prior to any new terms taking effect. What constitutes a material change will be
                  determined at our sole discretion. By continuing to access or use our Service
                  after any revisions become effective, you agree to be bound by the revised terms.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-display font-medium text-foreground tracking-tight">
                  10. Contact Us
                </h2>
                <div className="h-px w-20 bg-primary/30 mb-4" />
                <p>
                  If you have any questions about these Terms, please contact us at
                  aditya@adixcode.com.
                </p>
              </section>
            </div>
          </FadeIn>
        </div>
      </main>

      <Footer />
    </div>
  );
}
