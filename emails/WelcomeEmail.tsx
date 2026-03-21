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
import type { WelcomeEmailPayload } from '@/lib/email/types';

type Props = WelcomeEmailPayload & { baseUrl: string };

export function WelcomeEmail({ userName, dashboardUrl, baseUrl }: Props) {
  return (
    <BaseEmailLayout
      preview={`Welcome to Internode, ${userName}! Your workspace is ready.`}
      baseUrl={baseUrl}
    >
      <Heading style={heading}>Welcome aboard 🚀</Heading>

      <Text style={paragraph}>
        Hi <strong style={strong}>{userName}</strong>,
      </Text>

      <Text style={paragraph}>
        Your <strong style={strong}>Internode</strong> account is ready. You're now set up to manage
        tickets, track time, collaborate with your team, and ship great work.
      </Text>

      <Section style={featureList}>
        {[
          '📋  Create and manage tickets across projects',
          '⏱️  Log time directly against tasks',
          '🤝  Collaborate with your team in real time',
          '📊  Track goals and celebrate breakthroughs',
        ].map((feature) => (
          <Text key={feature} style={featureItem}>
            {feature}
          </Text>
        ))}
      </Section>

      <Text style={paragraph}>
        Start by creating or joining an organization to access your workspace.
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href={dashboardUrl}>
          GO TO DASHBOARD
        </Button>
      </Section>

      <Hr style={divider} />

      <Text style={footerText}>
        You&apos;re receiving this because you just created an Internode account.
      </Text>
    </BaseEmailLayout>
  );
}

export default WelcomeEmail;

const featureList: React.CSSProperties = {
  backgroundColor: '#161616',
  border: '1px solid #2a2a2a',
  borderRadius: '6px',
  padding: '16px 20px',
  margin: '16px 0 24px',
};

const featureItem: React.CSSProperties = {
  color: '#a0a0a0',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '4px 0',
  fontFamily,
};
