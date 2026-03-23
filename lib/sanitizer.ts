import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes an HTML string to prevent XSS.
 * This should be used for all rich-text inputs (e.g. ticket descriptions, comments).
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'b',
      'i',
      'strong',
      'em',
      'ul',
      'ol',
      'li',
      'a',
      'code',
      'pre',
      'blockquote',
      'h1',
      'h2',
      'h3',
      'span',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  });
}
