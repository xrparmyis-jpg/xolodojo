import { escapeHtml } from './pinPopupHtml';

/** True if the string looks like an HTML fragment (tags), not plain text with stray `<`. */
function looksLikeHtmlFragment(s: string): boolean {
  return /<\/?[a-z][a-z0-9]*[\s/>]/i.test(s);
}

/** Load legacy plain-text pins into TipTap without treating angle brackets as HTML when absent. */
export function legacyPinNoteToHtml(note: string | null | undefined): string {
  if (note == null) {
    return '<p></p>';
  }
  const t = note.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (!t) {
    return '<p></p>';
  }
  if (looksLikeHtmlFragment(t)) {
    return t;
  }
  const paragraphs = t.split(/\n\n+/).filter(Boolean);
  if (paragraphs.length === 0) {
    return '<p></p>';
  }
  return paragraphs
    .map(p => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
}
