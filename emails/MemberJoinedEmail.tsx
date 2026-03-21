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
import type { MemberJoinedPayload } from '@/lib/email/types';

type Props = MemberJoinedPayload & { baseUrl: string };

export function MemberJoinedEmail({
  adminName,
  newMemberName,
  newMemberEmail,
  membersUrl,
  organizationName,
  baseUrl,
}: Props) {
  return (
    <BaseEmailLayout preview={`${newMemberName} has joined ${organizationName}`} baseUrl={baseUrl}>
      <Heading style={heading}>A new member has joined</Heading>

      <Text style={paragraph}>
        Hi <strong style={strong}>{adminName}</strong>,
      </Text>

      <Text style={paragraph}>
        <strong style={strong}>{newMemberName}</strong> has accepted their invitation and joined{' '}
        <strong style={strong}>{organizationName}</strong>.
      </Text>

      <Section style={memberCard}>
        <table cellPadding="0" cellSpacing="0" role="presentation">
          <tr>
            <td style={avatarCell}>
              <div style={avatarIcon}>{newMemberName.charAt(0).toUpperCase()}</div>
            </td>
            <td style={{ verticalAlign: 'middle' }}>
              <Text style={memberName}>{newMemberName}</Text>
              <Text style={memberEmail}>{newMemberEmail}</Text>
            </td>
          </tr>
        </table>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href={membersUrl}>
          VIEW MEMBERS
        </Button>
      </Section>

      <Hr style={divider} />

      <Text style={footerText}>
        You are receiving this as an admin of <strong>{organizationName}</strong>.
      </Text>
    </BaseEmailLayout>
  );
}

export default MemberJoinedEmail;

const memberCard: React.CSSProperties = {
  backgroundColor: '#161616',
  border: '1px solid #2a2a2a',
  borderRadius: '6px',
  padding: '20px',
  margin: '16px 0 8px',
};

const avatarCell: React.CSSProperties = {
  verticalAlign: 'middle',
  paddingRight: '16px',
};

const avatarIcon: React.CSSProperties = {
  width: '44px',
  height: '44px',
  backgroundColor: 'rgba(0,255,85,0.12)',
  border: '1px solid rgba(0,255,85,0.25)',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#00ff55',
  fontSize: '18px',
  fontWeight: 700,
  fontFamily,
  textAlign: 'center' as const,
  lineHeight: '44px',
};

const memberName: React.CSSProperties = {
  color: '#e0e0e0',
  fontSize: '16px',
  fontWeight: 600,
  margin: '0 0 4px',
  fontFamily,
};

const memberEmail: React.CSSProperties = {
  color: '#5a5a5a',
  fontSize: '13px',
  margin: '0',
  fontFamily,
};
