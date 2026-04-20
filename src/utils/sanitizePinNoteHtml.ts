import DOMPurify from 'dompurify';

/** Must stay aligned with `server/lib/sanitizePinNoteHtml.ts`. */
const SANITIZE: Parameters<typeof DOMPurify.sanitize>[1] = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  ADD_ATTR: ['target'],
};

export function sanitizePinNoteHtml(html: string): string {
  return DOMPurify.sanitize(html, SANITIZE).trim();
}
