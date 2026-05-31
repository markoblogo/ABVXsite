import type { ContentImage } from '@/content';
import MediaPanel from './MediaPanel';

export default function WritingCard({
  title,
  excerpt,
  href,
  source,
  date,
  image,
}: {
  title: string;
  excerpt: string;
  href: string;
  source: string;
  date?: string;
  image?: ContentImage;
}) {
  return (
    <article className="writing-card">
      {image ? (
        <a href={href} target="_blank" rel="noopener noreferrer" aria-label={title}>
          <MediaPanel image={image} title={title} variant="writing" />
        </a>
      ) : null}
      <div className="writing-card__body">
        <div className="catalogue-card__meta">
          {source}
          {date ? ` / ${date}` : ''}
        </div>
        <h3>
          <a href={href} target="_blank" rel="noopener noreferrer">
            {title}
          </a>
        </h3>
        <p>{excerpt}</p>
      </div>
    </article>
  );
}
