import type { Artifact } from '@/content';
import LatestCard from './LatestCard';
import TagList from './TagList';

const linkLabels: Record<string, string> = {
  website: 'Site',
  github: 'GitHub',
  demo: 'Demo',
  youtube: 'YouTube',
  pdf: 'PDF',
};

export default function ArtifactCard({ artifact }: { artifact: Artifact }) {
  return (
    <article className="artifact-card">
      <LatestCard
        title={artifact.title}
        summary={artifact.summary}
        href={`/work/${artifact.slug}`}
        meta={`${artifact.group || artifact.type} / ${artifact.status}`}
        image={artifact.thumbnail}
      />
      <TagList tags={artifact.tags} />
      {artifact.links.length ? (
        <div className="card-link-row">
          {artifact.links.slice(0, 4).map((link) => (
            <a key={`${link.type}-${link.url}`} href={link.url} target="_blank" rel="noreferrer">
              {linkLabels[link.type] || link.label}
            </a>
          ))}
        </div>
      ) : null}
    </article>
  );
}
