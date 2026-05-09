import type { ContentLink } from '@/content';

const preferredLabels: Record<string, string> = {
  website: 'Site',
  github: 'GitHub',
  demo: 'Demo',
  youtube: 'YouTube',
  amazon: 'Amazon',
  'amazon-kindle': 'Kindle',
  'amazon-paperback': 'Paperback',
  pdf: 'PDF',
  'book-site': 'Site',
  'series-site': 'Series',
  medium: 'Medium',
  substack: 'Substack',
};

const priority: Record<string, number> = {
  website: 1,
  'book-site': 1,
  'series-site': 2,
  demo: 3,
  github: 4,
  'amazon-kindle': 5,
  'amazon-paperback': 6,
  amazon: 7,
  pdf: 8,
  youtube: 9,
  medium: 10,
  substack: 10,
  other: 99,
};

function orderedLinks(links: ContentLink[]): ContentLink[] {
  return [...links].sort((a, b) => {
    const diff = (priority[a.type] || 99) - (priority[b.type] || 99);
    if (diff) return diff;
    return a.label.localeCompare(b.label);
  });
}

export default function ActionLinks({
  links,
  limit,
  compact = false,
}: {
  links: ContentLink[];
  limit?: number;
  compact?: boolean;
}) {
  const visibleLinks = typeof limit === 'number' ? orderedLinks(links).slice(0, limit) : orderedLinks(links);
  if (!visibleLinks.length) return null;

  return (
    <div className={`action-links${compact ? ' action-links--compact' : ''}`}>
      {visibleLinks.map((link) => (
        <a key={`${link.type}-${link.url}`} href={link.url} target="_blank" rel="noreferrer">
          {preferredLabels[link.type] || link.label}
        </a>
      ))}
    </div>
  );
}
