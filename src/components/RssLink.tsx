export default function RssLink({href, label}: {href: string; label: string}) {
  return <a className="editorial-section-link rss-link" href={href} type="application/rss+xml" aria-label={`Subscribe via RSS: ${label}`}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="5" cy="19" r="1" fill="currentColor"/><path d="M4 4a16 16 0 0 1 16 16M4 11a9 9 0 0 1 9 9"/></svg>
    <span>RSS · {label}</span>
  </a>;
}
