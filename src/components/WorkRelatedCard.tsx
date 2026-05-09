import type { Artifact, Book, ContentImage, ContentLink } from '@/content';
import Link from 'next/link';
import MediaPanel from './MediaPanel';
import TagList from './TagList';
import WorkActionLinks from './WorkActionLinks';

type RelatedItem =
  | { kind: 'artifact'; item: Artifact }
  | { kind: 'book'; item: Book };

function isBookItem(related: RelatedItem): related is { kind: 'book'; item: Book } {
  return related.kind === 'book';
}

export default function WorkRelatedCard({ related }: { related: RelatedItem }) {
  const isBook = isBookItem(related);
  const title = isBook
    ? related.item.displayTitle || related.item.shortTitle || related.item.title
    : related.item.title;
  const href = isBook ? `/books/${related.item.slug}` : `/work/${related.item.slug}`;
  const image: ContentImage | undefined = isBook
    ? related.item.coverImage || related.item.heroImage
    : related.item.thumbnail || related.item.heroImage;
  const links: ContentLink[] = related.item.links;
  const meta = isBook
    ? related.item.series || related.item.category || related.item.type
    : related.item.group || related.item.type;
  const variant = isBook ? 'book' : 'project';

  return (
    <article className="work-related-card" data-kind={related.kind} data-media-role={image?.mediaRole || 'generic-thumbnail'}>
      {image ? (
        <Link className="work-related-card__media" href={href} aria-label={title}>
          <MediaPanel image={image} title={title} variant={variant} />
        </Link>
      ) : null}
      <div className="work-related-card__body">
        <div className="catalogue-card__meta">{meta}</div>
        <h3>
          <Link href={href}>{title}</Link>
        </h3>
        <p>{related.item.summary}</p>
        <TagList tags={related.item.tags.slice(0, 4)} />
        <WorkActionLinks links={links.slice(0, 4)} compact />
      </div>
    </article>
  );
}
