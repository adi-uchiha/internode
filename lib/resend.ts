import { Resend } from 'resend';
import { RESEND_API_KEY } from './env';

/**
 * Singleton Resend client.
 * Instantiated lazily — only when first used (avoids cold-start cost on
 * edge functions that never send email).
 */
let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(RESEND_API_KEY);
  }
  return _resend;
}
