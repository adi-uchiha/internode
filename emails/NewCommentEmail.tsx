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
import type { NewCommentPayload } from '@/lib/email/types';

type Props = NewCommentPayload & { baseUrl: string };

export function NewCommentEmail({
  recipientName,
  commenterName,
  ticketShortId,
  ticketTitle,
  commentSnippet,
  ticketUrl,
  organizationName,
  baseUrl,
}: Props) {
  const truncated =
    commentSnippet.length > 200 ? `${commentSnippet.slice(0, 200)}...` : commentSnippet;

  return (
    <BaseEmailLayout
      preview={`${commenterName} commented on [${ticketShortId}] ${ticketTitle}`}
      baseUrl={baseUrl}
    >
      <Heading style={heading}>New comment on your ticket</Heading>

      <Text style={paragraph}>
        Hi <strong style={strong}>{recipientName}</strong>,
      </Text>

      <Text style={paragraph}>
        <strong style={strong}>{commenterName}</strong> left a comment on{' '}
        <strong style={strong}>
          [{ticketShortId}] {ticketTitle}
        </strong>{' '}
        in <strong style={strong}>{organizationName}</strong>.
      </Text>

      <Section style={quoteBlock}>
        <Text style={quoteText}>{truncated}</Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href={ticketUrl}>
          VIEW COMMENT
        </Button>
      </Section>

      <Hr style={divider} />

      <Text style={footerText}>
        You are receiving this because you are associated with ticket{' '}
        <strong>[{ticketShortId}]</strong> in <strong>{organizationName}</strong>.
      </Text>
    </BaseEmailLayout>
  );
}

export default NewCommentEmail;
