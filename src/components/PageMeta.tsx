import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Per-page <title> and Open Graph / Twitter meta manager.
 *
 * Render this once near the top of a page component:
 *
 *   <PageMeta
 *     title="Meet the Team"
 *     description="The people building XoloDojo and Xglobe."
 *     image="/team/XoloCryptonite.jpg"
 *   />
 *
 * `image` may be a path under /public ("/team/Foo.jpg") — resolved against the
 * current origin — or an absolute URL. When a prop is omitted the site-wide
 * default (from index.html) is used.
 *
 * NOTE: this updates tags client-side only. Browsers and JS-rendering crawlers
 * (Google) see the per-page values; link-preview scrapers that do NOT run JS
 * (Facebook, X/Twitter, Discord, iMessage, Slack) still read the static tags
 * baked into index.html at build time. Making previews per-page for those
 * requires prerendering or a serverless OG handler (see server/handlers/og/).
 */

const SITE_NAME = 'XoloDojo';
const DEFAULT_TITLE =
  'The Xoloitzquintli Collection: Ancient Legacy, 10,001 Unique XRPL NFTs';
const DEFAULT_DESCRIPTION = DEFAULT_TITLE;
const DEFAULT_IMAGE = '/home/Home2.jpg';
const FALLBACK_ORIGIN = 'https://xolodojo.io';

interface PageMetaProps {
  /** Page title. `" — XoloDojo"` is appended for the browser tab. */
  title?: string;
  /** Meta description, shared by <meta name="description">, og:description, twitter:description. */
  description?: string;
  /** Social preview image: a /public path or an absolute URL. */
  image?: string;
}

function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const origin =
    typeof window !== 'undefined' ? window.location.origin : FALLBACK_ORIGIN;
  return `${origin}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function PageMeta({ title, description, image }: PageMetaProps) {
  const { pathname } = useLocation();

  useEffect(() => {
    const socialTitle = title || DEFAULT_TITLE;
    const tabTitle = title ? `${title} — ${SITE_NAME}` : DEFAULT_TITLE;
    const desc = description || DEFAULT_DESCRIPTION;
    const imageUrl = absoluteUrl(image || DEFAULT_IMAGE);
    const pageUrl = absoluteUrl(pathname || '/');

    document.title = tabTitle;
    setMeta('name', 'description', desc);

    setMeta('property', 'og:title', socialTitle);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:image', imageUrl);
    setMeta('property', 'og:url', pageUrl);

    setMeta('name', 'twitter:title', socialTitle);
    setMeta('name', 'twitter:description', desc);
    setMeta('name', 'twitter:image', imageUrl);

    setLink('canonical', pageUrl);
  }, [title, description, image, pathname]);

  return null;
}

export default PageMeta;
