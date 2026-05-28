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
import type { SubscriptionCanceledPayload } from '@/lib/email/types';

type Props = SubscriptionCanceledPayload & { baseUrl: string };

export function SubscriptionCanceledEmail({
  adminName,
  planName,
  endsAtDate,
  reSubscribeUrl,
  baseUrl,
}: Props) {
  return (
    <BaseEmailLayout preview={`Your ${planName} subscription has been canceled.`} baseUrl={baseUrl}>
      <Heading style={heading}>Subscription Canceled ⚠️</Heading>

      <Text style={paragraph}>
        Hi <strong style={strong}>{adminName}</strong>,
      </Text>

      <Text style={paragraph}>
        We are writing to confirm that your Internode <strong style={strong}>{planName}</strong>{' '}
        subscription has been canceled.
      </Text>

      <Section style={warningCard}>
        <Text style={warningTitle}>[GRACE_PERIOD_NOTICE]</Text>
        <Text style={warningText}>
          Your workspace will retain full Pro benefits until{' '}
          <strong style={strong}>{endsAtDate}</strong>. After this date, your workspace will be
          safely downgraded to the Starter Free plan. No data or tickets will be deleted, but volume
          limits (5 active interns, 3 active projects) will take effect.
        </Text>
      </Section>

      <Text style={paragraph}>
        If this was a mistake or you want to keep your Pro subscription active without interruption,
        you can re-subscribe by clicking the link below.
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href={reSubscribeUrl}>
          RE-SUBSCRIBE TO PRO
        </Button>
      </Section>

      <Hr style={divider} />

      <Text style={footerText}>
        You are receiving this transaction notice as an administrator of your organization.
      </Text>
    </BaseEmailLayout>
  );
}

export default SubscriptionCanceledEmail;

const warningCard: React.CSSProperties = {
  backgroundColor: '#1c1616',
  border: '1px solid #3c1e1e',
  borderRadius: '6px',
  padding: '16px 20px',
  margin: '16px 0 24px',
};

const warningTitle: React.CSSProperties = {
  color: '#ff4444',
  fontSize: '11px',
  fontFamily,
  fontWeight: 'bold',
  letterSpacing: '1px',
  margin: '0 0 10px 0',
};

const warningText: React.CSSProperties = {
  color: '#c0a0a0',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
  fontFamily,
};
