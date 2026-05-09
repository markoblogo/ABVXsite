import type { ContentImage, ContentLink } from '@/content';
import ActionLinks from './ActionLinks';
import MediaPanel from './MediaPanel';
import TagList from './TagList';

export default function DetailHero({
  eyebrow,
  title,
  subtitle,
  summary,
  tags,
  links,
  image,
  variant,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  summary: string;
  tags: string[];
  links: ContentLink[];
  image?: ContentImage;
  variant: 'project' | 'book';
}) {
  return (
    <header className={`detail-hero detail-hero--${variant}`}>
      <div className="detail-hero__copy">
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {subtitle ? <p className="detail-hero__subtitle">{subtitle}</p> : null}
        <p className="detail-hero__summary">{summary}</p>
        <TagList tags={tags} />
        <ActionLinks links={links} />
      </div>
      <MediaPanel image={image} title={title} variant={variant} />
    </header>
  );
}
