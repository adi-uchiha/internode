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
  quoteBlock,
  quoteText,
} from './shared/BaseEmailLayout';
import type { LeaveSubmittedPayload } from '@/lib/email/types';

type Props = LeaveSubmittedPayload & { baseUrl: string };

export function LeaveSubmittedEmail({
  adminName,
  requesterName,
  leaveType,
  leaveDate,
  reason,
  dashboardUrl,
  organizationName,
  baseUrl,
}: Props) {
  const capitalizedType = leaveType.charAt(0).toUpperCase() + leaveType.slice(1);

  return (
    <BaseEmailLayout
      preview={`${requesterName} submitted a ${leaveType} leave request for ${leaveDate}`}
      baseUrl={baseUrl}
    >
      <Heading style={heading}>New leave request pending review</Heading>

      <Text style={paragraph}>
        Hi <strong style={strong}>{adminName}</strong>,
      </Text>

      <Text style={paragraph}>
        <strong style={strong}>{requesterName}</strong> has submitted a leave request in{' '}
        <strong style={strong}>{organizationName}</strong> that requires your review.
      </Text>

      <Section style={detailCard}>
        <table cellPadding="0" cellSpacing="0" role="presentation" style={{ width: '100%' }}>
          <tr>
            <td style={{ paddingBottom: '12px', paddingRight: '24px' }}>
              <Text style={detailLabel}>REQUESTER</Text>
              <Text style={detailValue}>{requesterName}</Text>
            </td>
            <td style={{ paddingBottom: '12px' }}>
              <Text style={detailLabel}>TYPE</Text>
              <Text style={detailValue}>{capitalizedType}</Text>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <Text style={detailLabel}>DATE</Text>
              <Text style={detailValue}>{leaveDate}</Text>
            </td>
          </tr>
        </table>
      </Section>

      {reason && (
        <>
          <Text style={{ ...paragraph, margin: '16px 0 4px' }}>
            <strong style={strong}>Reason:</strong>
          </Text>
          <Section style={quoteBlock}>
            <Text style={quoteText}>{reason}</Text>
          </Section>
        </>
      )}

      <Section style={buttonContainer}>
        <Button style={button} href={dashboardUrl}>
          REVIEW REQUEST
        </Button>
      </Section>

      <Hr style={divider} />

      <Text style={footerText}>
        You are receiving this as an admin of <strong>{organizationName}</strong>. You can manage
        all leave requests from the leaves dashboard.
      </Text>
    </BaseEmailLayout>
  );
}

export default LeaveSubmittedEmail;

const detailCard: React.CSSProperties = {
  backgroundColor: '#161616',
  border: '1px solid #2a2a2a',
  borderRadius: '6px',
  padding: '20px',
  margin: '16px 0 8px',
};

const detailLabel: React.CSSProperties = {
  color: '#4a4a4a',
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  margin: '0 0 4px',
  fontFamily,
};

const detailValue: React.CSSProperties = {
  color: '#e0e0e0',
  fontSize: '15px',
  fontWeight: 600,
  margin: '0',
  fontFamily,
};
