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
import type { OverdueTicketPayload } from '@/lib/email/types';

type Props = OverdueTicketPayload & { baseUrl: string };

export function OverdueTicketEmail({
  assigneeName,
  ticketShortId,
  ticketTitle,
  dueDate,
  ticketUrl,
  organizationName,
  baseUrl,
}: Props) {
  return (
    <BaseEmailLayout
      preview={`Overdue: [${ticketShortId}] ${ticketTitle} was due on ${dueDate}`}
      baseUrl={baseUrl}
    >
      <Heading style={{ ...heading, color: '#f59e0b' }}>⚠ Overdue ticket reminder</Heading>

      <Text style={paragraph}>
        Hi <strong style={strong}>{assigneeName}</strong>,
      </Text>

      <Text style={paragraph}>
        A ticket assigned to you in <strong style={strong}>{organizationName}</strong> has passed
        its due date and is not yet marked as done.
      </Text>

      <Section style={overdueCard}>
        <Text style={overdueLabel}>TICKET</Text>
        <Text style={ticketIdText}>{ticketShortId}</Text>
        <Text style={ticketTitleText}>{ticketTitle}</Text>
        <Text style={dueDateRow}>
          <span style={dueDateLabel}>Was due:</span> <span style={dueDateValue}>{dueDate}</span>
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href={ticketUrl}>
          VIEW TICKET
        </Button>
      </Section>

      <Hr style={divider} />

      <Text style={footerText}>
        You are receiving this automated reminder because you are the assignee of this ticket in{' '}
        <strong>{organizationName}</strong>. Update the ticket status to stop receiving these
        reminders.
      </Text>
    </BaseEmailLayout>
  );
}

export default OverdueTicketEmail;

const overdueCard: React.CSSProperties = {
  backgroundColor: '#1a1200',
  border: '1px solid rgba(245, 158, 11, 0.3)',
  borderLeft: '3px solid #f59e0b',
  borderRadius: '6px',
  padding: '20px',
  margin: '16px 0 8px',
};

const overdueLabel: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  margin: '0 0 4px',
  fontFamily,
};

const ticketIdText: React.CSSProperties = {
  color: '#f59e0b',
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '0.1em',
  margin: '0 0 4px',
  fontFamily,
};

const ticketTitleText: React.CSSProperties = {
  color: '#e0e0e0',
  fontSize: '16px',
  fontWeight: 600,
  margin: '0 0 12px',
  fontFamily,
};

const dueDateRow: React.CSSProperties = {
  margin: '0',
  fontSize: '13px',
  fontFamily,
};

const dueDateLabel: React.CSSProperties = {
  color: '#6b7280',
};

const dueDateValue: React.CSSProperties = {
  color: '#f87171',
  fontWeight: 600,
};
