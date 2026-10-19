import type { ContentLink } from '@/content';
import ActionLinks from './ActionLinks';

export default function BookActionLinks({ links, compact = false, limit }: { links: ContentLink[]; compact?: boolean; limit?: number }) {
  return <ActionLinks links={links} compact={compact} limit={limit} kind="book" variant="book" />;
}
