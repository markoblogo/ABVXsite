import type { Artifact } from '@/content';
import ActionLinks from './ActionLinks';
import MediaPanel from './MediaPanel';
import TagList from './TagList';
import Link from 'next/link';

export default function ProjectCatalogueCard({
  artifact,
  tone = 'systems',
}: {
  artifact: Artifact;
  tone?: 'focus' | 'systems';
}) {
  return (
    <article className={`project-catalogue-card project-catalogue-card--${tone}`}>
      {artifact.thumbnail ? (
        <Link className="project-catalogue-card__media" href={`/work/${artifact.slug}`} aria-label={artifact.title}>
          <MediaPanel image={artifact.thumbnail} title={artifact.title} variant="project" />
        </Link>
      ) : null}
      <div className="project-catalogue-card__body">
        <div className="catalogue-card__meta">{artifact.group || artifact.status}</div>
        <h3>
          <Link href={`/work/${artifact.slug}`}>{artifact.title}</Link>
        </h3>
        <p>{artifact.summary}</p>
        <TagList tags={artifact.tags.slice(0, 4)} />
        <ActionLinks links={artifact.links} limit={4} compact />
      </div>
    </article>
  );
}
