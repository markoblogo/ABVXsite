import type { ContentLink } from '@/content';
import { groupCatalogueActions } from '../lib/catalogue-actions.mjs';

const labels: Record<string, string> = {
  site: 'Site', website: 'Site', blog: 'Blog', github: 'GitHub', demo: 'Demo',
  amazon: 'Amazon', kindle: 'Kindle', paperback: 'Paperback',
  'amazon-kindle': 'Kindle', 'amazon-paperback': 'Paperback', pdf: 'PDF', epub: 'EPUB',
  audio: 'Audio', audiobook: 'Audiobook', series: 'Series', 'book-site': 'Site',
  'series-site': 'Series', bsky: 'Bluesky', bluesky: 'Bluesky', x: 'X', linkedin: 'LinkedIn',
  telegram: 'Telegram', discord: 'Discord', 'youtube-channel': 'YouTube',
  medium: 'Medium', substack: 'Substack', rss: 'RSS', deck: 'Deck',
};

export default function ActionLinks({ links, limit, compact = false, kind = 'work', variant = 'generic' }: {
  links: ContentLink[];
  limit?: number;
  compact?: boolean;
  kind?: 'book' | 'work';
  variant?: 'book' | 'work' | 'generic';
}) {
  const groups = groupCatalogueActions(links, kind, limit);
  if (!groups.primary.length && !groups.secondary.length) return null;
  const prefix = variant === 'generic' ? 'action-links' : `${variant}-action-links`;
  return (
    <div className={`${prefix}${compact ? ` ${prefix}--compact` : ''} catalogue-actions${compact ? ' catalogue-actions--compact' : ''}`}>
      {(['primary', 'secondary'] as const).map(group => groups[group].length ? (
        <div key={group} className={`catalogue-actions__row catalogue-actions__row--${group}`} role="group" aria-label={group === 'primary' ? 'Primary actions' : 'More links'}>
          {groups[group].map(link => (
            <a key={`${link.type}-${link.url}`} href={link.url} target="_blank" rel="noopener noreferrer"
              className={`${kind === 'book' ? 'plausible-event-name=Book+Link+Click ' : ''}${prefix}__link${group === 'primary' ? ` ${prefix}__link--primary` : ''} catalogue-actions__link catalogue-actions__link--${group}`}>
              {link.type === 'youtube' ? link.label || 'YouTube' : kind === 'book' && ['site', 'book-site'].includes(link.type) ? 'Book site' : labels[link.type] || link.label}
              {group === 'secondary' ? <span className="catalogue-actions__arrow" aria-hidden="true">↗</span> : null}
            </a>
          ))}
        </div>
      ) : null)}
    </div>
  );
}
