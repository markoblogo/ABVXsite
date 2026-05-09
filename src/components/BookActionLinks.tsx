import type { ContentLink } from '@/content';

const labels: Record<string, string> = {
  website: 'Site',
  github: 'GitHub',
  demo: 'Demo',
  youtube: 'YouTube',
  amazon: 'Amazon',
  'amazon-kindle': 'Kindle',
  'amazon-paperback': 'Paperback',
  pdf: 'PDF',
  'book-site': 'Book site',
  'series-site': 'Series site',
  medium: 'Medium',
  substack: 'Substack',
  other: 'Open',
};

const priority: Record<string, number> = {
  'amazon-kindle': 1,
  'amazon-paperback': 2,
  amazon: 3,
  pdf: 4,
  'book-site': 5,
  'series-site': 6,
  youtube: 7,
  github: 8,
  website: 9,
  demo: 10,
  medium: 11,
  substack: 12,
  other: 99,
};

function orderedLinks(links: ContentLink[]): ContentLink[] {
  return [...links].sort((a, b) => {
    const diff = (priority[a.type] || 99) - (priority[b.type] || 99);
    if (diff) return diff;
    return a.label.localeCompare(b.label);
  });
}

function isPrimary(link: ContentLink): boolean {
  return ['amazon-kindle', 'amazon-paperback', 'amazon', 'pdf'].includes(link.type);
}

export default function BookActionLinks({
  links,
  compact = false,
}: {
  links: ContentLink[];
  compact?: boolean;
}) {
  const visibleLinks = orderedLinks(links);
  if (!visibleLinks.length) return null;

  return (
    <div className={`book-action-links${compact ? ' book-action-links--compact' : ''}`}>
      {visibleLinks.map((link) => (
        <a
          key={`${link.type}-${link.url}`}
          className={isPrimary(link) ? 'book-action-links__link book-action-links__link--primary' : 'book-action-links__link'}
          href={link.url}
          target="_blank"
          rel="noreferrer"
        >
          {labels[link.type] || link.label}
        </a>
      ))}
    </div>
  );
}
