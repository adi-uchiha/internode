/* eslint-disable @next/next/no-page-custom-font */
import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Font,
} from '@react-email/components';
import * as React from 'react';

interface BaseEmailLayoutProps {
  preview: string;
  baseUrl: string;
  children: React.ReactNode;
}

/**
 * Shared layout wrapper for all Internode transactional emails.
 *
 * Provides the consistent dark-mode shell: HTML boilerplate, Space Grotesk font,
 * INTERNODE logo header, and the copyright footer strip.
 *
 * Usage:
 *   <BaseEmailLayout preview="Preview text shown in inbox" baseUrl={NEXT_PUBLIC_APP_URL}>
 *     <Heading>...</Heading>
 *     <Text>...</Text>
 *   </BaseEmailLayout>
 */
export function BaseEmailLayout({ preview, baseUrl, children }: BaseEmailLayoutProps) {
  const logoUrl = `${baseUrl.replace(/\/$/, '')}/icon-green.png`;

  return (
    <Html lang="en">
      <Head>
        {}
        <link
          href="https://fonts.googleapis.com/css?family=Space+Grotesk:400,700&display=swap"
          rel="stylesheet"
        />
        {}
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <Font
          fontFamily="Space Grotesk"
          fallbackFontFamily="Helvetica"
          webFont={{
            url: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>

      <Preview>{preview}</Preview>

      <Body style={main}>
        <Container style={container}>
          {/* ── Header ──────────────────────────────────────── */}
          <Section style={header}>
            <table cellPadding="0" cellSpacing="0" role="presentation">
              <tr>
                <td style={{ verticalAlign: 'middle', paddingRight: '10px' }}>
                  <Img src={logoUrl} width="28" height="28" alt="Internode" style={logoImg} />
                </td>
                <td style={{ verticalAlign: 'middle' }}>
                  <Text style={logoText}>INTERNODE</Text>
                </td>
              </tr>
            </table>
          </Section>

          {/* ── Body ────────────────────────────────────────── */}
          <Section style={bodySection}>{children}</Section>

          {/* ── Footer ──────────────────────────────────────── */}
          <Section style={footerSection}>
            <Text style={footerSmall}>
              © {new Date().getFullYear()} Internode · Engineering-Grade Project Management
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ─── Exported shared styles (available to templates for consistency) ────────

export const fontFamily =
  'Space Grotesk, "Google Sans", Roboto, "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif';

export const heading: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 700,
  letterSpacing: '-0.02em',
  lineHeight: '1.3',
  margin: '0 0 28px',
  fontFamily,
};

export const paragraph: React.CSSProperties = {
  color: '#a0a0a0',
  fontSize: '15px',
  lineHeight: '1.7',
  margin: '0 0 16px',
  fontFamily,
};

export const strong: React.CSSProperties = {
  color: '#e0e0e0',
  fontWeight: 600,
};

export const buttonContainer: React.CSSProperties = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

export const button: React.CSSProperties = {
  backgroundColor: '#00ff55',
  color: '#080808',
  fontSize: '13px',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  textDecoration: 'none',
  padding: '14px 36px',
  borderRadius: '6px',
  display: 'inline-block',
  fontFamily,
};

export const divider: React.CSSProperties = {
  borderColor: '#1f1f1f',
  margin: '24px 0',
};

export const footerText: React.CSSProperties = {
  color: '#4a4a4a',
  fontSize: '12px',
  lineHeight: '1.6',
  margin: '0',
  fontFamily,
};

export const quoteBlock: React.CSSProperties = {
  backgroundColor: '#1a1a1a',
  borderLeft: '3px solid #00ff55',
  padding: '12px 16px',
  margin: '16px 0',
  borderRadius: '0 4px 4px 0',
};

export const quoteText: React.CSSProperties = {
  color: '#c0c0c0',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
  fontFamily,
  fontStyle: 'italic',
};

// ─── Private layout styles ───────────────────────────────────────────────────

const main: React.CSSProperties = {
  backgroundColor: '#080808',
  fontFamily,
  padding: '40px 0',
};

const container: React.CSSProperties = {
  margin: '0 auto',
  maxWidth: '560px',
};

const header: React.CSSProperties = {
  padding: '24px 32px',
  backgroundColor: '#0d0d0d',
  borderBottom: '1px solid rgba(0, 255, 85, 0.12)',
};

const logoImg: React.CSSProperties = {
  display: 'block',
};

const logoText: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: 700,
  letterSpacing: '0.18em',
  margin: '0',
  fontFamily,
  lineHeight: '28px',
};

const bodySection: React.CSSProperties = {
  padding: '40px 32px 32px',
  backgroundColor: '#111111',
  borderLeft: '1px solid #1a1a1a',
  borderRight: '1px solid #1a1a1a',
};

const footerSection: React.CSSProperties = {
  padding: '20px 32px',
  backgroundColor: '#0d0d0d',
  borderTop: '1px solid rgba(0, 255, 85, 0.12)',
  textAlign: 'center' as const,
};

const footerSmall: React.CSSProperties = {
  color: '#333333',
  fontSize: '11px',
  margin: '0',
  fontFamily,
};
