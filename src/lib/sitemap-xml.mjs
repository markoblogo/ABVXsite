import {xmlEscape} from './rss.mjs';

/** Sitemap protocol fields precede extension elements (including hreflang links). */
export function renderSitemap(entries) {
  const localized = entries.some(item => Object.keys(item.alternates?.languages || {}).length);
  const urls = entries.map(item => {
    const fields = [`<loc>${xmlEscape(item.url)}</loc>`];
    if (item.lastModified) fields.push(`<lastmod>${xmlEscape(item.lastModified instanceof Date ? item.lastModified.toISOString() : item.lastModified)}</lastmod>`);
    if (item.changeFrequency) fields.push(`<changefreq>${xmlEscape(item.changeFrequency)}</changefreq>`);
    if (typeof item.priority === 'number') fields.push(`<priority>${item.priority}</priority>`);
    for (const [language, url] of Object.entries(item.alternates?.languages || {})) {
      fields.push(`<xhtml:link rel="alternate" hreflang="${xmlEscape(language)}" href="${xmlEscape(url)}" />`);
    }
    return `<url>\n${fields.join('\n')}\n</url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${localized ? ' xmlns:xhtml="http://www.w3.org/1999/xhtml"' : ''}>\n${urls.join('\n')}\n</urlset>\n`;
}
