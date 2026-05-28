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
import type { SubscriptionUpgradedPayload } from '@/lib/email/types';

type Props = SubscriptionUpgradedPayload & { baseUrl: string };

export function SubscriptionUpgradedEmail({
  adminName,
  planName,
  maxMembers,
  maxProjects,
  billingPortalUrl,
  baseUrl,
}: Props) {
  return (
    <BaseEmailLayout
      preview={`Your workspace has been successfully upgraded to ${planName}!`}
      baseUrl={baseUrl}
    >
      <Heading style={heading}>Workspace Upgraded! 🚀</Heading>

      <Text style={paragraph}>
        Hi <strong style={strong}>{adminName}</strong>,
      </Text>

      <Text style={paragraph}>
        Great news! Your Internode workspace has been successfully upgraded to the{' '}
        <strong style={strong}>{planName}</strong> plan. All features remain unlocked, and your new
        usage limits are now active.
      </Text>

      <Section style={limitCard}>
        <Text style={limitTitle}>[NEW_LIMITS_ACTIVATED]</Text>
        <Text style={limitItem}>
          👥 Active Interns limit: <strong style={strong}>{maxMembers}</strong>
        </Text>
        <Text style={limitItem}>
          📁 Active Projects limit: <strong style={strong}>{maxProjects}</strong>
        </Text>
      </Section>

      <Text style={paragraph}>
        You can manage your subscription, download invoices, or update payment information at any
        time via the Lemon Squeezy billing portal.
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href={billingPortalUrl}>
          MANAGE SUBSCRIPTION
        </Button>
      </Section>

      <Hr style={divider} />

      <Text style={footerText}>
        You are receiving this transaction notice as an administrator of your organization.
      </Text>
    </BaseEmailLayout>
  );
}

export default SubscriptionUpgradedEmail;

const limitCard: React.CSSProperties = {
  backgroundColor: '#161616',
  border: '1px solid #2a2a2a',
  borderRadius: '6px',
  padding: '16px 20px',
  margin: '16px 0 24px',
};

const limitTitle: React.CSSProperties = {
  color: '#00ff66',
  fontSize: '11px',
  fontFamily,
  fontWeight: 'bold',
  letterSpacing: '1px',
  margin: '0 0 10px 0',
};

const limitItem: React.CSSProperties = {
  color: '#a0a0a0',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '4px 0',
  fontFamily,
};
