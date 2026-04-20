/** Approximate visible text length from HTML (used for min/max validation). */
export function plainTextLengthFromHtml(html: string): number {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim().length;
}
