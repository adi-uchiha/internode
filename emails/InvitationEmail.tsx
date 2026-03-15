import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Font,
} from '@react-email/components';
import * as React from 'react';

interface InvitationEmailProps {
  inviterName: string;
  inviterEmail: string;
  organizationName: string;
  role: string;
  acceptUrl: string;
  expiresInDays?: number;
  baseUrl: string;
}

export function InvitationEmail({
  inviterName,
  inviterEmail,
  organizationName,
  role,
  acceptUrl,
  expiresInDays = 7,
  baseUrl,
}: InvitationEmailProps) {
  const capitalizedRole = role.charAt(0).toUpperCase() + role.slice(1);
  const logoUrl = `${baseUrl}/icon-green.png`;

  return (
    <Html lang="en">
      <Head>
        <Font
          fontFamily="Space Grotesk"
          fallbackFontFamily="Helvetica"
          webFont={{
            url: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&display=swap',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>
        {inviterName} invited you to join {organizationName} on Internode
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* ── Header ─────────────────────────────────────── */}
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

          {/* ── Main Content ───────────────────────────────── */}
          <Section style={bodySection}>
            <Heading style={heading}>You have been invited</Heading>

            <Text style={paragraph}>
              <strong style={strong}>{inviterName}</strong> ({inviterEmail}) has invited you to join{' '}
              <strong style={strong}>{organizationName}</strong> on Internode as a{' '}
              <strong style={strong}>{capitalizedRole}</strong>.
            </Text>

            <Text style={paragraph}>
              Click the button below to accept the invitation and get started. This invitation
              expires in <strong style={strong}>{expiresInDays} days</strong>.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={acceptUrl}>
                ACCEPT INVITATION
              </Button>
            </Section>

            <Text style={orText}>Or copy this link into your browser:</Text>
            <Text style={linkText}>{acceptUrl}</Text>

            <Hr style={divider} />

            <Text style={footer}>
              If you did not expect this invitation, you can safely ignore this email. This
              invitation was sent by <strong>{inviterName}</strong> ({inviterEmail}) for{' '}
              <strong>{organizationName}</strong>.
            </Text>
          </Section>

          {/* ── Footer ─────────────────────────────────────── */}
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

export default InvitationEmail;

// ─── Styles ─────────────────────────────────────────────────────────────────

const fontFamily =
  '"Space Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

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

const heading: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 700,
  letterSpacing: '-0.02em',
  lineHeight: '1.3',
  margin: '0 0 28px',
  fontFamily,
};

const paragraph: React.CSSProperties = {
  color: '#a0a0a0',
  fontSize: '15px',
  lineHeight: '1.7',
  margin: '0 0 16px',
  fontFamily,
};

const strong: React.CSSProperties = {
  color: '#e0e0e0',
  fontWeight: 600,
};

const buttonContainer: React.CSSProperties = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button: React.CSSProperties = {
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

const orText: React.CSSProperties = {
  color: '#4a4a4a',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '0 0 8px',
  fontFamily,
};

const linkText: React.CSSProperties = {
  color: '#00ff55',
  fontSize: '12px',
  textAlign: 'center' as const,
  wordBreak: 'break-all' as const,
  margin: '0 0 32px',
  fontFamily,
};

const divider: React.CSSProperties = {
  borderColor: '#1f1f1f',
  margin: '24px 0',
};

const footer: React.CSSProperties = {
  color: '#4a4a4a',
  fontSize: '12px',
  lineHeight: '1.6',
  margin: '0',
  fontFamily,
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
