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
import type { TicketAssignedPayload } from '@/lib/email/types';

type Props = TicketAssignedPayload & { baseUrl: string };

export function TicketAssignedEmail({
  assigneeName,
  assignerName,
  ticketShortId,
  ticketTitle,
  ticketUrl,
  organizationName,
  baseUrl,
}: Props) {
  return (
    <BaseEmailLayout
      preview={`${assignerName} assigned you to ${ticketShortId}: ${ticketTitle}`}
      baseUrl={baseUrl}
    >
      <Heading style={heading}>New task assigned to you</Heading>

      <Text style={paragraph}>
        Hi <strong style={strong}>{assigneeName}</strong>,
      </Text>

      <Text style={paragraph}>
        <strong style={strong}>{assignerName}</strong> has assigned you to ticket{' '}
        <strong style={strong}>[{ticketShortId}]</strong> in{' '}
        <strong style={strong}>{organizationName}</strong>.
      </Text>

      <Section style={ticketCard}>
        <Text style={ticketIdLabel}>{ticketShortId}</Text>
        <Text style={ticketTitleStyle}>{ticketTitle}</Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href={ticketUrl}>
          OPEN TICKET
        </Button>
      </Section>

      <Hr style={divider} />

      <Text style={footerText}>
        You are receiving this because you were assigned to this ticket in{' '}
        <strong>{organizationName}</strong>. If this was a mistake, please contact your team admin.
      </Text>
    </BaseEmailLayout>
  );
}

export default TicketAssignedEmail;

const ticketCard: React.CSSProperties = {
  backgroundColor: '#161616',
  border: '1px solid #2a2a2a',
  borderLeft: '3px solid #00ff55',
  borderRadius: '6px',
  padding: '16px 20px',
  margin: '16px 0 8px',
};

const ticketIdLabel: React.CSSProperties = {
  color: '#00ff55',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  margin: '0 0 6px',
  fontFamily,
};

const ticketTitleStyle: React.CSSProperties = {
  color: '#e0e0e0',
  fontSize: '16px',
  fontWeight: 600,
  margin: '0',
  fontFamily,
  lineHeight: '1.4',
};
