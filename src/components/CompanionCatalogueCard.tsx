import type { Artifact, Book } from '@/content';
import ActionLinks from './ActionLinks';
import MediaPanel from './MediaPanel';
import TagList from './TagList';
import Link from 'next/link';

function isBook(item: Artifact | Book): item is Book {
  return ['book', 'translation', 'free-edition', 'companion', 'series'].includes(item.type);
}

export default function CompanionCatalogueCard({
  item,
  variantLabel,
  tone,
}: {
  item: Artifact | Book;
  variantLabel?: string;
  tone?: 'companion-project' | 'protocol-tool' | 'free-resource';
}) {
  const title = isBook(item) ? item.displayTitle || item.shortTitle || item.title : item.title;
  const href = isBook(item) ? `/books/${item.slug}` : `/work/${item.slug}`;
  const image = isBook(item) ? item.coverImage : item.thumbnail;
  const meta = isBook(item) ? item.series || item.category || item.type : item.group || item.status;

  return (
    <article className={`companion-catalogue-card${tone ? ` companion-catalogue-card--${tone}` : ''}`}>
      <Link className="companion-catalogue-card__media" href={href} aria-label={title}>
        <MediaPanel image={image} title={title} variant="project" />
      </Link>
      <div className="companion-catalogue-card__body">
        {variantLabel ? <div className="catalogue-type-label">{variantLabel}</div> : null}
        <div className="catalogue-card__meta">{meta}</div>
        <h3>
          <Link href={href}>{title}</Link>
        </h3>
        <p>{item.summary}</p>
        <TagList tags={item.tags.slice(0, 4)} />
        <ActionLinks links={item.links} limit={4} compact />
      </div>
    </article>
  );
}
