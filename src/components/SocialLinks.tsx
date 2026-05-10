import type { ContentLink } from '@/content';
import { socialLabel } from '@/content/link-utils';

export default function SocialLinks({
  links,
  compact = false,
}: {
  links: ContentLink[];
  compact?: boolean;
}) {
  if (!links.length) return null;

  return (
    <div className={`social-links${compact ? ' social-links--compact' : ''}`}>
      {links.map((link) => (
        <a key={`${link.type}-${link.url}`} href={link.url} target="_blank" rel="noreferrer">
          {socialLabel(link)}
        </a>
      ))}
    </div>
  );
}
