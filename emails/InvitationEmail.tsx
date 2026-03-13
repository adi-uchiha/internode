import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface InvitationEmailProps {
  inviterName: string;
  inviterEmail: string;
  organizationName: string;
  role: string;
  acceptUrl: string;
  expiresInDays?: number;
}

export function InvitationEmail({
  inviterName,
  inviterEmail,
  organizationName,
  role,
  acceptUrl,
  expiresInDays = 7,
}: InvitationEmailProps) {
  const capitalizedRole = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <Html lang="en">
      <Head />
      <Preview>
        {inviterName} invited you to join {organizationName} on Internode
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <div style={logoBox}>
              <div style={logoDot} />
            </div>
            <Text style={logoText}>INTERNODE</Text>
          </Section>

          {/* Body */}
          <Section style={bodySection}>
            <Heading style={heading}>You have been invited</Heading>

            <Text style={paragraph}>
              <strong>{inviterName}</strong> ({inviterEmail}) has invited you to join{' '}
              <strong>{organizationName}</strong> on Internode as a{' '}
              <strong>{capitalizedRole}</strong>.
            </Text>

            <Text style={paragraph}>
              Click the button below to accept the invitation and get started. This invitation
              expires in <strong>{expiresInDays} days</strong>.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={acceptUrl}>
                Accept Invitation
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

            <Text style={footerSmall}>
              © {new Date().getFullYear()} Internode · Developer Operations Platform
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default InvitationEmail;

// ─── Styles ───────────────────────────────────────────────────────────────────

const main: React.CSSProperties = {
  backgroundColor: '#0a0a0a',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container: React.CSSProperties = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
};

const header: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '24px 32px',
  borderBottom: '1px solid #1f1f1f',
};

const logoBox: React.CSSProperties = {
  width: '28px',
  height: '28px',
  border: '2px solid #00ff88',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const logoDot: React.CSSProperties = {
  width: '10px',
  height: '10px',
  backgroundColor: '#00ff88',
};

const logoText: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 700,
  letterSpacing: '0.15em',
  margin: '0 0 0 8px',
  lineHeight: '28px',
};

const bodySection: React.CSSProperties = {
  padding: '40px 32px',
  backgroundColor: '#111111',
  border: '1px solid #1f1f1f',
  margin: '0 0 0 0',
};

const heading: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 700,
  letterSpacing: '-0.02em',
  lineHeight: '1.3',
  margin: '0 0 24px',
};

const paragraph: React.CSSProperties = {
  color: '#a1a1a1',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 16px',
};

const buttonContainer: React.CSSProperties = {
  textAlign: 'center',
  margin: '32px 0',
};

const button: React.CSSProperties = {
  backgroundColor: '#00ff88',
  color: '#0a0a0a',
  fontSize: '13px',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  padding: '14px 32px',
  display: 'inline-block',
};

const orText: React.CSSProperties = {
  color: '#555555',
  fontSize: '12px',
  textAlign: 'center',
  margin: '0 0 8px',
};

const linkText: React.CSSProperties = {
  color: '#00ff88',
  fontSize: '12px',
  textAlign: 'center',
  wordBreak: 'break-all',
  margin: '0 0 32px',
};

const divider: React.CSSProperties = {
  borderColor: '#1f1f1f',
  margin: '24px 0',
};

const footer: React.CSSProperties = {
  color: '#555555',
  fontSize: '12px',
  lineHeight: '1.6',
  margin: '0 0 16px',
};

const footerSmall: React.CSSProperties = {
  color: '#333333',
  fontSize: '11px',
  textAlign: 'center',
  margin: '0',
};
