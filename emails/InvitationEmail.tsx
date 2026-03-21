import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import * as React from 'react';
import {
  BaseEmailLayout,
  fontFamily,
  heading,
  paragraph,
  strong,
  button,
  buttonContainer,
  divider,
  footerText,
} from './shared/BaseEmailLayout';
import type { InvitationEmailPayload } from '@/lib/email/types';

type Props = InvitationEmailPayload & { baseUrl: string };

export function InvitationEmail({
  inviterName,
  inviterEmail,
  organizationName,
  role,
  acceptUrl,
  expiresInDays = 7,
  baseUrl,
}: Props) {
  const capitalizedRole = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <BaseEmailLayout
      preview={`${inviterName} invited you to join ${organizationName} on Internode`}
      baseUrl={baseUrl}
    >
      <Heading style={heading}>You have been invited</Heading>

      <Text style={paragraph}>
        <strong style={strong}>{inviterName}</strong> ({inviterEmail}) has invited you to join{' '}
        <strong style={strong}>{organizationName}</strong> on Internode as a{' '}
        <strong style={strong}>{capitalizedRole}</strong>.
      </Text>

      <Text style={paragraph}>
        Click the button below to accept the invitation and get started. This invitation expires in{' '}
        <strong style={strong}>{expiresInDays} days</strong>.
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href={acceptUrl}>
          ACCEPT INVITATION
        </Button>
      </Section>

      <Text style={orText}>Or copy this link into your browser:</Text>
      <Text style={linkText}>{acceptUrl}</Text>

      <Hr style={divider} />

      <Text style={footerText}>
        If you did not expect this invitation, you can safely ignore this email. This invitation was
        sent by <strong>{inviterName}</strong> ({inviterEmail}) for{' '}
        <strong>{organizationName}</strong>.
      </Text>
    </BaseEmailLayout>
  );
}

export default InvitationEmail;

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
