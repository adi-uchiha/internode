import { SMTPClient } from 'emailjs';
import { SMTP_USER, SMTP_PASSWORD } from './env';

/**
 * Universal SMTP client using emailjs.
 * Configured for Gmail SMTP with an App Password.
 */
export const client = new SMTPClient({
  user: SMTP_USER,
  password: SMTP_PASSWORD,
  host: 'smtp.gmail.com',
  ssl: true,
});
