import type { ContentLink } from '@/content';

const labels: Record<string, string> = {
  site: 'Site',
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
  'book-site': 'Book site',
  series: 'Series site',
  'series-site': 'Series site',
  bluesky: 'Bluesky',
  x: 'X',
  linkedin: 'LinkedIn',
  telegram: 'Telegram',
  discord: 'Discord',
  'youtube-channel': 'YouTube',
  medium: 'Medium',
  substack: 'Substack',
  deck: 'Deck',
  other: 'Open',
};

const priority: Record<string, number> = {
  site: 1,
  website: 1,
  demo: 2,
  deck: 3,
  pdf: 3,
  series: 5,
  'book-site': 4,
  'series-site': 5,
  github: 6,
  youtube: 7,
  bluesky: 8,
  x: 8,
  linkedin: 8,
  telegram: 8,
  discord: 8,
  'youtube-channel': 8,
  medium: 8,
  substack: 9,
  amazon: 10,
  kindle: 11,
  'amazon-kindle': 11,
  paperback: 12,
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
  return ['site', 'website', 'demo', 'pdf', 'deck', 'book-site', 'series-site', 'series'].includes(link.type);
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
