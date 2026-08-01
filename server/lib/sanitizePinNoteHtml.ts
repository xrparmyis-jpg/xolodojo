/**
 * Server-side pin-note sanitizer.
 * Kept dependency-free so the Vercel API function does not pull ESM-only
 * `htmlparser2` via `sanitize-html` (which crashes Node CJS require).
 * Must stay aligned with `src/utils/sanitizePinNoteHtml.ts` allowlists.
 */

const ALLOWED_TAGS = new Set(['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li']);
const VOID_TAGS = new Set(['br']);
const ALLOWED_SCHEMES = /^(https?:|mailto:)/i;

function decodeAttr(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function encodeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function sanitizeAnchorAttrs(rawAttrs: string): string {
  const hrefMatch = rawAttrs.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  const hrefRaw = hrefMatch?.[1] ?? hrefMatch?.[2] ?? hrefMatch?.[3] ?? '';
  const href = decodeAttr(hrefRaw).trim();
  if (!href || !ALLOWED_SCHEMES.test(href) || /[\s<>]/.test(href)) {
    return '';
  }

  const parts = [`href="${encodeAttr(href)}"`];
  if (/\btarget\s*=\s*(?:"_blank"|'_blank'|_blank)/i.test(rawAttrs)) {
    parts.push('target="_blank"', 'rel="noopener noreferrer"');
  }
  if (/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.test(rawAttrs)) {
    const classMatch = rawAttrs.match(/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const className = decodeAttr(classMatch?.[1] ?? classMatch?.[2] ?? classMatch?.[3] ?? '').trim();
    if (className && !/[<>"]/.test(className)) {
      parts.push(`class="${encodeAttr(className)}"`);
    }
  }
  return ` ${parts.join(' ')}`;
}

/** Must stay aligned with `src/utils/sanitizePinNoteHtml.ts`. */
export function sanitizePinNoteHtmlServer(html: string): string {
  if (!html) return '';

  const withoutComments = html.replace(/<!--[\s\S]*?-->/g, '');
  const stripped = withoutComments.replace(
    /<\/?([a-zA-Z0-9]+)(\s[^>]*)?>/g,
    (full, tagName: string, attrs = '') => {
      const tag = tagName.toLowerCase();
      const isClose = full.startsWith('</');
      if (!ALLOWED_TAGS.has(tag)) {
        return '';
      }
      if (isClose) {
        return VOID_TAGS.has(tag) ? '' : `</${tag}>`;
      }
      if (VOID_TAGS.has(tag)) {
        return `<${tag}>`;
      }
      if (tag === 'a') {
        return `<a${sanitizeAnchorAttrs(attrs)}>`;
      }
      return `<${tag}>`;
    }
  );

  return stripped.trim();
}
