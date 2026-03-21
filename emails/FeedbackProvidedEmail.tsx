import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import {
  BaseEmailLayout,
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
import type { FeedbackProvidedPayload } from '@/lib/email/types';

type Props = FeedbackProvidedPayload & { baseUrl: string };

export function FeedbackProvidedEmail({
  recipientName,
  adminName,
  itemType,
  itemTitle,
  comment,
  dashboardUrl,
  organizationName,
  baseUrl,
}: Props) {
  const itemTypeLabel = itemType === 'time-log' ? 'Time Log' : 'Breakthrough';

  return (
    <BaseEmailLayout
      preview={`${adminName} left feedback on your ${itemTypeLabel}`}
      baseUrl={baseUrl}
    >
      <Heading style={heading}>You received feedback</Heading>

      <Text style={paragraph}>
        Hi <strong style={strong}>{recipientName}</strong>,
      </Text>

      <Text style={paragraph}>
        <strong style={strong}>{adminName}</strong> reviewed your{' '}
        <strong style={strong}>{itemTypeLabel}</strong>
        {itemTitle ? (
          <>
            {' '}
            — <strong style={strong}>{itemTitle}</strong>
          </>
        ) : null}{' '}
        in <strong style={strong}>{organizationName}</strong> and left the following comment:
      </Text>

      <Section style={quoteBlock}>
        <Text style={quoteText}>{comment}</Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href={dashboardUrl}>
          VIEW FEEDBACK
        </Button>
      </Section>

      <Hr style={divider} />

      <Text style={footerText}>
        You are receiving this because a manager reviewed your submission in{' '}
        <strong>{organizationName}</strong>.
      </Text>
    </BaseEmailLayout>
  );
}

export default FeedbackProvidedEmail;
