/** Public site URL for links in emails and post-auth redirects (server-side). */
export function getAppPublicOrigin(): string {
  const trimmed = (value: string) => value.replace(/\/$/, '');
  if (process.env.APP_PUBLIC_URL) {
    return trimmed(process.env.APP_PUBLIC_URL);
  }
  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (process.env.VERCEL_ENV === 'production' && productionHost) {
    return `https://${trimmed(productionHost)}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${trimmed(process.env.VERCEL_URL)}`;
  }
  return 'http://localhost:5173';
}
