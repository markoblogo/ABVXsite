import type { Artifact, ContentImage } from '@/content';
import { operationalLinks, socialLinks } from '@/content/link-utils';
import MediaPanel from './MediaPanel';
import SocialLinks from './SocialLinks';
import TagList from './TagList';
import WorkActionLinks from './WorkActionLinks';

export default function WorkDetailHero({
  artifact,
  image,
}: {
  artifact: Artifact;
  image?: ContentImage;
}) {
  const channels = socialLinks(artifact.links);

  return (
    <header className={`work-detail-hero${image ? ' work-detail-hero--with-media' : ''}`}>
      <div className="work-detail-hero__copy">
        <div className="eyebrow">{artifact.group || artifact.type} / {artifact.status}</div>
        <h1>{artifact.title}</h1>
        <p className="work-detail-hero__summary">{artifact.summary}</p>
        <TagList tags={artifact.tags} />
        <WorkActionLinks links={operationalLinks(artifact.links)} />
        <SocialLinks links={channels} compact />
      </div>
      {image ? (
        <div className="work-detail-hero__media">
          <MediaPanel image={image} title={artifact.title} variant="project" priority />
        </div>
      ) : null}
    </header>
  );
}
