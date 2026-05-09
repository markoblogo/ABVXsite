import type { Artifact } from '@/content';
import LatestCard from './LatestCard';
import TagList from './TagList';

export default function ArtifactCard({ artifact }: { artifact: Artifact }) {
  return (
    <article className="artifact-card">
      <LatestCard
        title={artifact.title}
        summary={artifact.summary}
        href={`/work/${artifact.slug}`}
        meta={`${artifact.type} / ${artifact.status}`}
      />
      <TagList tags={artifact.tags} />
    </article>
  );
}
