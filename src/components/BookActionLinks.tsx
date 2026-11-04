import type { ContentLink } from '@/content';
import ActionLinks from './ActionLinks';

export default function BookActionLinks({ links, compact = false, limit, locale = 'en' }: { links: ContentLink[]; compact?: boolean; limit?: number; locale?: 'en' | 'fr' }) {
  return <ActionLinks links={links} compact={compact} limit={limit} kind="book" variant="book" locale={locale} />;
}
