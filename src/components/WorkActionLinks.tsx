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
  website: 1,
  demo: 2,
  pdf: 3,
  'book-site': 4,
  'series-site': 5,
  github: 6,
  youtube: 7,
  medium: 8,
  substack: 9,
  amazon: 10,
  'amazon-kindle': 11,
  'amazon-paperback': 12,
  other: 99,
};

function orderedLinks(links: ContentLink[]): ContentLink[] {
  return [...links].sort((a, b) => {
    const diff = (priority[a.type] || 99) - (priority[b.type] || 99);
    if (diff) return diff;
    return a.label.localeCompare(b.label);
  });
}

function labelFor(link: ContentLink): string {
  if (link.label.toLowerCase().includes('deck')) return 'Deck';
  return labels[link.type] || link.label;
}

function isPrimary(link: ContentLink): boolean {
  return ['website', 'demo', 'pdf', 'book-site', 'series-site'].includes(link.type);
}

export default function WorkActionLinks({
  links,
  compact = false,
}: {
  links: ContentLink[];
  compact?: boolean;
}) {
  const visibleLinks = orderedLinks(links);
  if (!visibleLinks.length) return null;

  return (
    <div className={`work-action-links${compact ? ' work-action-links--compact' : ''}`}>
      {visibleLinks.map((link) => (
        <a
          key={`${link.type}-${link.url}`}
          className={isPrimary(link) ? 'work-action-links__link work-action-links__link--primary' : 'work-action-links__link'}
          href={link.url}
          target="_blank"
          rel="noreferrer"
        >
          {labelFor(link)}
        </a>
      ))}
    </div>
  );
}
