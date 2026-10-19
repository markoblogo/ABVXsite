import type { ContentLink } from '@/content';
import ActionLinks from './ActionLinks';

export default function WorkActionLinks({ links, compact = false, limit }: { links: ContentLink[]; compact?: boolean; limit?: number }) {
  return <ActionLinks links={links} compact={compact} limit={limit} kind="work" variant="work" />;
}
