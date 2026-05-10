import type { ContentLink } from './types';

export const socialLinkTypes = new Set([
  'bluesky',
  'x',
  'linkedin',
  'telegram',
  'discord',
  'youtube-channel',
  'medium',
  'substack',
]);

export const socialLinkLabels: Record<string, string> = {
  bluesky: 'Bluesky',
  x: 'X',
  linkedin: 'LinkedIn',
  telegram: 'Telegram',
  discord: 'Discord',
  'youtube-channel': 'YouTube',
  medium: 'Medium',
  substack: 'Substack',
};

export function isSocialLink(link: ContentLink): boolean {
  return socialLinkTypes.has(link.type);
}

export function operationalLinks(links: ContentLink[]): ContentLink[] {
  return links.filter((link) => !isSocialLink(link));
}

export function socialLinks(links: ContentLink[]): ContentLink[] {
  return links.filter(isSocialLink);
}

export function socialLabel(link: ContentLink): string {
  return socialLinkLabels[link.type] || link.label;
}
