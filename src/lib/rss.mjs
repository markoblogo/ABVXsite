import {writingTopics} from '../content/writing-topics.mjs';

export const rssFeeds = [
  {path: 'writing.xml', title: 'ABVX Writing', page: '/writing?source=abvx', kind: 'writing'},
  ...writingTopics.map(topic => ({path: `writing/${topic.slug}.xml`, title: `ABVX — ${topic.label}`, page: `/writing?source=abvx&topic=${topic.slug}`, kind: 'writing', topic: topic.slug})),
  {path: 'books.xml', title: 'ABVX Books', page: '/books', kind: 'books'},
  {path: 'projects.xml', title: 'ABVX Projects', page: '/systems', kind: 'projects'},
];

// XML 1.0 rejects these control characters, including inside CDATA.
const clean = value => String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, '');
export const xmlEscape = value => clean(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
const cdata = value => '<![CDATA[' + clean(value).replaceAll(']]>', ']]]]><![CDATA[>') + ']]>';
const date = value => value && Number.isFinite(Date.parse(value)) ? new Date(value).toUTCString() : null;

/** Inputs contain public entries only; URLs are stable item identities across edits. */
export function renderRss(feed, entries, origin = 'https://abvx.xyz') {
  const escape = xmlEscape;
  const latest = entries.map(item => item.updatedAt || item.publishedAt).filter(value => date(value)).sort((a, b) => Date.parse(b) - Date.parse(a))[0];
  const items = entries.map(item => `<item>
<title>${escape(item.title)}</title><link>${escape(item.url)}</link><guid isPermaLink="true">${escape(item.url)}</guid>
${date(item.publishedAt) ? `<pubDate>${date(item.publishedAt)}</pubDate>` : ''}
<description>${escape(item.summary)}</description><content:encoded>${cdata(item.html)}</content:encoded>
${(item.categories || []).map(category => `<category>${escape(category)}</category>`).join('')}
${item.image ? `<media:content url="${escape(item.image)}" medium="image"/><media:thumbnail url="${escape(item.image)}"/>` : ''}
</item>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
<channel><title>${escape(feed.title)}</title><link>${escape(new URL(feed.page, origin).href)}</link>
<description>${escape(feed.title)}: full text and illustrations.</description>
<atom:link href="${escape(origin + '/rss/' + feed.path)}" rel="self" type="application/rss+xml"/>
${date(latest) ? `<lastBuildDate>${date(latest)}</lastBuildDate>` : ''}
${items}</channel></rss>`;
}
