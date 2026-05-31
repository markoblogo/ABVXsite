import type { ContentLink } from '@/content';

const labels: Record<string, string> = {
  site: 'Book site',
  website: 'Site',
  github: 'GitHub',
  demo: 'Demo',
  youtube: 'YouTube',
  amazon: 'Amazon',
  kindle: 'Kindle',
  paperback: 'Paperback',
  'amazon-kindle': 'Kindle',
  'amazon-paperback': 'Paperback',
  pdf: 'PDF',
  epub: 'EPUB',
  series: 'Series site',
  'book-site': 'Book site',
  'series-site': 'Series site',
  medium: 'Medium',
  substack: 'Substack',
  other: 'Open',
};

const priority: Record<string, number> = {
  kindle: 1,
  'amazon-kindle': 1,
  paperback: 2,
  'amazon-paperback': 2,
  amazon: 3,
  pdf: 4,
  epub: 5,
  site: 6,
  'book-site': 6,
  series: 7,
  'series-site': 7,
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
  return ['kindle', 'paperback', 'amazon-kindle', 'amazon-paperback', 'amazon', 'pdf', 'epub'].includes(link.type);
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
          rel="noopener noreferrer"
        >
          {labels[link.type] || link.label}
        </a>
      ))}
    </div>
  );
}
