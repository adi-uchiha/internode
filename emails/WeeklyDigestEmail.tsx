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
import type { WeeklyDigestPayload } from '@/lib/email/types';

type Props = WeeklyDigestPayload & { baseUrl: string };

export function WeeklyDigestEmail({
  recipientName,
  weekLabel,
  ticketsCompleted,
  ticketsInProgress,
  hoursLogged,
  goalsCompleted,
  goalsTotal,
  dashboardUrl,
  organizationName,
  baseUrl,
}: Props) {
  const goalPercent = goalsTotal > 0 ? Math.round((goalsCompleted / goalsTotal) * 100) : 0;

  return (
    <BaseEmailLayout
      preview={`Your weekly summary for ${weekLabel} — ${organizationName}`}
      baseUrl={baseUrl}
    >
      <Heading style={heading}>Your weekly summary</Heading>

      <Text style={paragraph}>
        Hi <strong style={strong}>{recipientName}</strong>, here's a quick look at your activity in{' '}
        <strong style={strong}>{organizationName}</strong> for{' '}
        <strong style={strong}>{weekLabel}</strong>.
      </Text>

      {/* Stats grid */}
      <Section style={statsGrid}>
        <table cellPadding="0" cellSpacing="0" role="presentation" style={{ width: '100%' }}>
          <tr>
            <td style={statCell}>
              <Text style={statNumber}>{ticketsCompleted}</Text>
              <Text style={statLabel}>Tickets Completed</Text>
            </td>
            <td style={statCellBorder}>
              <Text style={statNumber}>{ticketsInProgress}</Text>
              <Text style={statLabel}>In Progress</Text>
            </td>
            <td style={statCell}>
              <Text style={statNumber}>{hoursLogged}h</Text>
              <Text style={statLabel}>Hours Logged</Text>
            </td>
          </tr>
        </table>
      </Section>

      {/* Goals row */}
      {goalsTotal > 0 && (
        <Section style={goalsCard}>
          <table cellPadding="0" cellSpacing="0" role="presentation" style={{ width: '100%' }}>
            <tr>
              <td>
                <Text style={goalsTitle}>
                  Weekly Goals — {goalsCompleted}/{goalsTotal} completed ({goalPercent}%)
                </Text>
                {/* Progress bar */}
                <div style={progressTrack}>
                  <div style={{ ...progressFill, width: `${goalPercent}%` }} />
                </div>
              </td>
            </tr>
          </table>
        </Section>
      )}

      <Section style={buttonContainer}>
        <Button style={button} href={dashboardUrl}>
          VIEW DASHBOARD
        </Button>
      </Section>

      <Hr style={divider} />

      <Text style={footerText}>
        You are receiving this weekly digest as a member of <strong>{organizationName}</strong>. You
        can disable this in your notification preferences.
      </Text>
    </BaseEmailLayout>
  );
}

export default WeeklyDigestEmail;

const statsGrid: React.CSSProperties = {
  backgroundColor: '#161616',
  border: '1px solid #2a2a2a',
  borderRadius: '6px',
  margin: '16px 0 12px',
  overflow: 'hidden',
};

const statCell: React.CSSProperties = {
  padding: '20px',
  textAlign: 'center' as const,
  width: '33%',
};

const statCellBorder: React.CSSProperties = {
  ...statCell,
  borderLeft: '1px solid #2a2a2a',
  borderRight: '1px solid #2a2a2a',
};

const statNumber: React.CSSProperties = {
  color: '#00ff55',
  fontSize: '28px',
  fontWeight: 700,
  margin: '0 0 4px',
  fontFamily,
  letterSpacing: '-0.02em',
};

const statLabel: React.CSSProperties = {
  color: '#5a5a5a',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  margin: '0',
  fontFamily,
};

const goalsCard: React.CSSProperties = {
  backgroundColor: '#161616',
  border: '1px solid #2a2a2a',
  borderRadius: '6px',
  padding: '20px',
  margin: '0 0 8px',
};

const goalsTitle: React.CSSProperties = {
  color: '#a0a0a0',
  fontSize: '13px',
  margin: '0 0 10px',
  fontFamily,
};

const progressTrack: React.CSSProperties = {
  backgroundColor: '#2a2a2a',
  borderRadius: '4px',
  height: '6px',
  width: '100%',
  overflow: 'hidden',
};

const progressFill: React.CSSProperties = {
  backgroundColor: '#00ff55',
  height: '6px',
  borderRadius: '4px',
  minWidth: '4px',
};
