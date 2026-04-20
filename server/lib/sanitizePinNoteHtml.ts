import sanitizeHtml from 'sanitize-html';

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li'],
  allowedAttributes: {
    a: ['href', 'target', 'rel', 'class'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: {},
  allowProtocolRelative: false,
};

/** Must stay aligned with `src/utils/sanitizePinNoteHtml.ts`. */
export function sanitizePinNoteHtmlServer(html: string): string {
  return sanitizeHtml(html, OPTIONS).trim();
}
