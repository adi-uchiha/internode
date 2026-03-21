import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import * as React from 'react';
import {
  BaseEmailLayout,
  fontFamily,
  paragraph,
  strong,
  button,
  buttonContainer,
  divider,
  footerText,
  quoteBlock,
  quoteText,
} from './shared/BaseEmailLayout';
import type { LeaveStatusPayload } from '@/lib/email/types';

type Props = LeaveStatusPayload & { baseUrl: string };

export function LeaveStatusEmail({
  requesterName,
  leaveType,
  leaveDate,
  status,
  reviewerName,
  reason,
  dashboardUrl,
  organizationName,
  baseUrl,
}: Props) {
  const isApproved = status === 'approved';
  const capitalizedType = leaveType.charAt(0).toUpperCase() + leaveType.slice(1);

  const headingStyle: React.CSSProperties = {
    color: isApproved ? '#00ff55' : '#ff4444',
    fontSize: '24px',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    lineHeight: '1.3',
    margin: '0 0 28px',
    fontFamily,
  };

  const statusBadge: React.CSSProperties = {
    display: 'inline-block',
    backgroundColor: isApproved ? 'rgba(0, 255, 85, 0.1)' : 'rgba(255, 68, 68, 0.1)',
    color: isApproved ? '#00ff55' : '#ff4444',
    border: `1px solid ${isApproved ? 'rgba(0,255,85,0.3)' : 'rgba(255,68,68,0.3)'}`,
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    padding: '4px 12px',
    borderRadius: '4px',
    fontFamily,
  };

  const previewText = isApproved
    ? `Your ${leaveType} leave for ${leaveDate} has been approved`
    : `Your ${leaveType} leave request has been declined`;

  return (
    <BaseEmailLayout preview={previewText} baseUrl={baseUrl}>
      <Heading style={headingStyle}>
        {isApproved ? '✓ Leave Approved' : '✗ Leave Request Declined'}
      </Heading>

      <Text style={paragraph}>
        Hi <strong style={strong}>{requesterName}</strong>,
      </Text>

      <Text style={paragraph}>
        Your <strong style={strong}>{capitalizedType}</strong> leave request for{' '}
        <strong style={strong}>{leaveDate}</strong> in{' '}
        <strong style={strong}>{organizationName}</strong> has been reviewed by{' '}
        <strong style={strong}>{reviewerName}</strong>.
      </Text>

      <Section style={resultCard}>
        <table cellPadding="0" cellSpacing="0" role="presentation">
          <tr>
            <td style={{ paddingRight: '16px' }}>
              <Text style={resultLabel}>STATUS</Text>
              <span style={statusBadge}>{status}</span>
            </td>
            <td>
              <Text style={resultLabel}>LEAVE DATE</Text>
              <Text style={resultValue}>{leaveDate}</Text>
            </td>
          </tr>
        </table>
      </Section>

      {!isApproved && reason && (
        <>
          <Text style={{ ...paragraph, margin: '16px 0 4px' }}>
            <strong style={strong}>Reason for decline:</strong>
          </Text>
          <Section style={quoteBlock}>
            <Text style={quoteText}>{reason}</Text>
          </Section>
        </>
      )}

      {!isApproved && (
        <Text style={paragraph}>
          If you have questions, please reach out to your manager directly.
        </Text>
      )}

      <Section style={buttonContainer}>
        <Button style={button} href={dashboardUrl}>
          VIEW MY LEAVES
        </Button>
      </Section>

      <Hr style={divider} />

      <Text style={footerText}>
        You are receiving this because you submitted a leave request in{' '}
        <strong>{organizationName}</strong>.
      </Text>
    </BaseEmailLayout>
  );
}

export default LeaveStatusEmail;

const resultCard: React.CSSProperties = {
  backgroundColor: '#161616',
  border: '1px solid #2a2a2a',
  borderRadius: '6px',
  padding: '20px',
  margin: '16px 0 8px',
};

const resultLabel: React.CSSProperties = {
  color: '#4a4a4a',
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  margin: '0 0 6px',
  fontFamily,
};

const resultValue: React.CSSProperties = {
  color: '#e0e0e0',
  fontSize: '15px',
  fontWeight: 600,
  margin: '0',
  fontFamily,
};
