import { Metadata } from 'next';
import { Navigation } from '@/components/landing/Navigation';
import { Footer } from '@/components/landing/Footer';
import { FadeIn } from '@/components/landing/Animations';
import { NEXT_PUBLIC_APP_NAME } from '@/lib/env';

export const metadata: Metadata = {
  title: `Privacy Policy | ${NEXT_PUBLIC_APP_NAME}`,
  description: `Privacy Policy for ${NEXT_PUBLIC_APP_NAME}, outlines data collection, use, and user rights details.`,
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6 max-w-4xl">
          {/* Header Section */}
          <FadeIn direction="up" className="mb-12">
            <span className="inline-block font-mono text-xs uppercase tracking-widest text-primary mb-4 px-3 py-1 border border-primary/30 bg-primary/5">
              [SYSTEM_PRIVACY_DOC_v1.0]
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-light leading-tight mb-4">
              Privacy <span className="italic text-primary">Policy</span>
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
                  1. Information We Collect
                </h2>
                <div className="h-px w-20 bg-primary/30 mb-4" />
                <p>
                  We collect information to provide, maintain, and improve our engineering-grade
                  project management services. This includes:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong className="text-foreground">Account and Profile Information:</strong>{' '}
                    When you sign up via Better-Auth (including GitHub OAuth integration), we
                    receive details such as your name, email address, profile photo, and OAuth
                    tokens necessary to authenticate you.
                  </li>
                  <li>
                    <strong className="text-foreground">Project and Usage Data:</strong> We store
                    tasks, project lists, organization names, time logs, comments, and project
                    metadata created on the Service. This is stored securely in our database (Neon
                    DB).
                  </li>
                  <li>
                    <strong className="text-foreground">Assets and Uploads:</strong> Any
                    attachments, screenshots, or files uploaded to projects are stored securely on
                    Cloudinary.
                  </li>
                  <li>
                    <strong className="text-foreground">Analytics and Device Info:</strong> We
                    collect technical logs (IP address, browser type, operating system) and usage
                    logs to monitor security and system performance.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-display font-medium text-foreground tracking-tight">
                  2. How We Use Your Information
                </h2>
                <div className="h-px w-20 bg-primary/30 mb-4" />
                <p>We use the collected information for the following purposes:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>To verify your identity and manage your account.</li>
                  <li>To display dashboards, boards, and timeline logs.</li>
                  <li>
                    To calculate organizational velocity metrics and compile weekly AI work
                    summaries (if subscribed to Pro Growth or Enterprise).
                  </li>
                  <li>
                    To process payment subscriptions through our third-party merchant, Lemon
                    Squeezy.
                  </li>
                  <li>
                    To communicate system updates, security alerts, and administrative messages.
                  </li>
                  <li>To debug errors, prevent abuse, and optimize platform speed.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-display font-medium text-foreground tracking-tight">
                  3. Payment Processing and Subscriptions
                </h2>
                <div className="h-px w-20 bg-primary/30 mb-4" />
                <p>
                  All payments are processed securely through{' '}
                  <strong className="text-foreground">Lemon Squeezy</strong>. We do not store or
                  directly collect credit card numbers or payment credentials on our servers. Lemon
                  Squeezy provides secure merchant of record payment processing services, and their
                  use of your personal information is governed by their own Privacy Policy.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-display font-medium text-foreground tracking-tight">
                  4. Third-Party Service Providers
                </h2>
                <div className="h-px w-20 bg-primary/30 mb-4" />
                <p>
                  We share information with reliable service providers who assist us in operating
                  our platform:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong className="text-foreground">Neon DB:</strong> Serverless PostgreSQL
                    database hosting where all your project data is stored.
                  </li>
                  <li>
                    <strong className="text-foreground">Cloudinary:</strong> Image and media storage
                    infrastructure.
                  </li>
                  <li>
                    <strong className="text-foreground">GitHub OAuth:</strong> Used for secure login
                    credentials via Better-Auth.
                  </li>
                </ul>
                <p>
                  These third parties are contractually obligated to protect your data and only use
                  it as necessary to provide these infrastructure services to {NEXT_PUBLIC_APP_NAME}
                  .
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-display font-medium text-foreground tracking-tight">
                  5. Data Security
                </h2>
                <div className="h-px w-20 bg-primary/30 mb-4" />
                <p>
                  The security of your personal and project data is a priority. We implement
                  industry-standard encryption protocols (SSL/TLS) for data in transit and ensure
                  access tokens, database connections, and secrets are encrypted. However, please
                  remember that no method of transmission over the Internet or method of electronic
                  storage is 100% secure.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-display font-medium text-foreground tracking-tight">
                  6. Cookies and Sessions
                </h2>
                <div className="h-px w-20 bg-primary/30 mb-4" />
                <p>
                  We use essential cookies to maintain user session states, verify authorization,
                  and secure our forms. These are required for the basic operation of the Service.
                  You can set your browser to refuse cookies, but some components of the project
                  management dashboard will not function.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-display font-medium text-foreground tracking-tight">
                  7. Your Rights and Choices
                </h2>
                <div className="h-px w-20 bg-primary/30 mb-4" />
                <p>
                  You have the right to access, update, export, or delete the information we have on
                  you. In most cases, you can do this directly from your workspace dashboard
                  settings. If you need additional assistance with data removal or exporting your
                  projects under GDPR/CCPA regulations, please contact us.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-display font-medium text-foreground tracking-tight">
                  8. Changes to Privacy Policy
                </h2>
                <div className="h-px w-20 bg-primary/30 mb-4" />
                <p>
                  We may update our Privacy Policy from time to time. We will notify you of any
                  changes by posting the new Privacy Policy on this page and updating the "Last
                  Updated" date. You are advised to review this Privacy Policy periodically for any
                  changes.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-display font-medium text-foreground tracking-tight">
                  9. Contact Us
                </h2>
                <div className="h-px w-20 bg-primary/30 mb-4" />
                <p>
                  If you have any questions about this Privacy Policy, please contact us at
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
