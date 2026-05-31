import type { Artifact, ContentImage } from '@/content';
import { operationalLinks, socialLinks } from '@/content/link-utils';
import ActionLinks from './ActionLinks';
import MediaPanel from './MediaPanel';
import SocialLinks from './SocialLinks';
import TagList from './TagList';
import Link from 'next/link';

export default function ProjectCatalogueCard({
  artifact,
  meta,
  href,
  title,
  summary,
  image,
  tone = 'systems',
}: {
  artifact: Artifact;
  meta?: string;
  href?: string;
  title?: string;
  summary?: string;
  image?: ContentImage;
  tone?: 'focus' | 'systems';
}) {
  const social = socialLinks(artifact.links);
  const cardHref = href || `/work/${artifact.slug}`;
  const cardTitle = title || artifact.title;
  const cardSummary = summary || artifact.summary;
  const cardImage = image || artifact.thumbnail;
  const isExternal = cardHref.startsWith('http');
  const media = cardImage ? (
    <MediaPanel image={cardImage} title={cardTitle} variant="project" />
  ) : null;
  const heading = isExternal ? (
    <a href={cardHref} target="_blank" rel="noopener noreferrer">
      {cardTitle}
    </a>
  ) : (
    <Link href={cardHref}>{cardTitle}</Link>
  );

  return (
    <article className={`project-catalogue-card project-catalogue-card--${tone}`}>
      {media && isExternal ? (
        <a className="project-catalogue-card__media" href={cardHref} target="_blank" rel="noopener noreferrer" aria-label={cardTitle}>
          {media}
        </a>
      ) : null}
      {media && !isExternal ? (
        <Link className="project-catalogue-card__media" href={cardHref} aria-label={cardTitle}>
          {media}
        </Link>
      ) : null}
      <div className="project-catalogue-card__body">
        <div className="catalogue-card__meta">{meta || artifact.group || artifact.status}</div>
        <h3>{heading}</h3>
        <p>{cardSummary}</p>
        <TagList tags={artifact.tags.slice(0, 4)} />
        <ActionLinks links={operationalLinks(artifact.links)} limit={4} compact />
        <SocialLinks links={social} compact />
      </div>
    </article>
  );
}
