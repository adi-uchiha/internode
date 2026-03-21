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
import type { TicketStatusChangedPayload } from '@/lib/email/types';

type Props = TicketStatusChangedPayload & { baseUrl: string };

const STATUS_COLORS: Record<string, string> = {
  todo: '#6b7280',
  'in-progress': '#f59e0b',
  'in-review': '#8b5cf6',
  done: '#00ff55',
  unplanned: '#374151',
};

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status.toLowerCase()] ?? '#9ca3af';
  return (
    <span
      style={{
        display: 'inline-block',
        backgroundColor: `${color}22`,
        color,
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
        padding: '3px 10px',
        borderRadius: '4px',
        border: `1px solid ${color}44`,
        fontFamily,
      }}
    >
      {status}
    </span>
  );
}

export function TicketStatusEmail({
  recipientName,
  changedByName,
  ticketShortId,
  ticketTitle,
  oldStatus,
  newStatus,
  ticketUrl,
  organizationName,
  baseUrl,
}: Props) {
  return (
    <BaseEmailLayout
      preview={`[${ticketShortId}] Status changed to ${newStatus}`}
      baseUrl={baseUrl}
    >
      <Heading style={heading}>Ticket status updated</Heading>

      <Text style={paragraph}>
        Hi <strong style={strong}>{recipientName}</strong>,
      </Text>

      <Text style={paragraph}>
        <strong style={strong}>{changedByName}</strong> updated the status of{' '}
        <strong style={strong}>
          [{ticketShortId}] {ticketTitle}
        </strong>{' '}
        in <strong style={strong}>{organizationName}</strong>.
      </Text>

      <Section style={changeCard}>
        <table cellPadding="0" cellSpacing="0" role="presentation" style={{ width: '100%' }}>
          <tr>
            <td style={{ paddingBottom: '12px' }}>
              <Text style={changeLabel}>TICKET</Text>
              <Text style={changeValue}>
                [{ticketShortId}] {ticketTitle}
              </Text>
            </td>
          </tr>
          <tr>
            <td>
              <table cellPadding="0" cellSpacing="0" role="presentation">
                <tr>
                  <td style={{ paddingRight: '12px' }}>
                    <Text style={changeLabel}>FROM</Text>
                    <StatusBadge status={oldStatus} />
                  </td>
                  <td style={{ paddingRight: '12px', color: '#4a4a4a', fontSize: '18px' }}>→</td>
                  <td>
                    <Text style={changeLabel}>TO</Text>
                    <StatusBadge status={newStatus} />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href={ticketUrl}>
          VIEW TICKET
        </Button>
      </Section>

      <Hr style={divider} />

      <Text style={footerText}>
        You are receiving this because you are associated with this ticket in{' '}
        <strong>{organizationName}</strong>.
      </Text>
    </BaseEmailLayout>
  );
}

export default TicketStatusEmail;

const changeCard: React.CSSProperties = {
  backgroundColor: '#161616',
  border: '1px solid #2a2a2a',
  borderRadius: '6px',
  padding: '20px',
  margin: '16px 0 8px',
};

const changeLabel: React.CSSProperties = {
  color: '#4a4a4a',
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  margin: '0 0 4px',
  fontFamily,
};

const changeValue: React.CSSProperties = {
  color: '#e0e0e0',
  fontSize: '14px',
  fontWeight: 600,
  margin: '0',
  fontFamily,
};
