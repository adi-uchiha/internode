import sanitizeHtmlLibrary from 'sanitize-html';

/**
 * Sanitizes an HTML string to prevent XSS.
 * This should be used for all rich-text inputs (e.g. ticket descriptions, comments).
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  return sanitizeHtmlLibrary(html, {
    allowedTags: [
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
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel', 'class'],
      '*': ['class'],
    },
  });
}
