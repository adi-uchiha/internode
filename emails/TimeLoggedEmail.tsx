import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import {
  BaseEmailLayout,
  heading,
  paragraph,
  strong,
  button,
  buttonContainer,
  divider,
  quoteBlock,
  quoteText,
} from './shared/BaseEmailLayout';
import type { TimeLoggedPayload } from '@/lib/email/types';

export function TimeLoggedEmail({
  recipientName,
  loggerName,
  ticketShortId,
  ticketTitle,
  hours,
  note,
  organizationName,
  dashboardUrl,
  baseUrl,
}: TimeLoggedPayload & { baseUrl: string }) {
  const noteDisplay = note?.trim() || 'No additional note provided.';

  return (
    <BaseEmailLayout
      preview={`[${ticketShortId}] ${loggerName} logged ${hours}h`}
      baseUrl={baseUrl}
    >
      <Heading style={heading}>Time Logged</Heading>

      <Text style={paragraph}>Hi {recipientName},</Text>

      <Text style={paragraph}>
        <strong style={strong}>{loggerName}</strong> just logged{' '}
        <strong style={strong}>{hours} hours</strong> on{' '}
        <strong style={strong}>
          [{ticketShortId}] {ticketTitle}
        </strong>
        .
      </Text>

      <Section style={quoteBlock}>
        <Text style={quoteText}>{noteDisplay}</Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href={dashboardUrl}>
          VIEW IN DASHBOARD
        </Button>
      </Section>

      <Hr style={divider} />

      <Text style={paragraph}>
        <small>
          You are receiving this email because you are an admin or owner of {organizationName}, and
          have time log notifications enabled.
        </small>
      </Text>
    </BaseEmailLayout>
  );
}

export default TimeLoggedEmail;
