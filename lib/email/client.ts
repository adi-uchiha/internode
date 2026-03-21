import { SMTPClient } from 'emailjs';
import { SMTP_USER, SMTP_PASSWORD } from '../env';

/**
 * Universal SMTP client using emailjs.
 * Configured for Gmail SMTP with an App Password.
 *
 * Do NOT import this directly in route handlers or auth hooks.
 * Use EmailService from lib/email/service.ts instead.
 */
export const smtpClient = new SMTPClient({
  user: SMTP_USER,
  password: SMTP_PASSWORD,
  host: 'smtp.gmail.com',
  ssl: true,
});
