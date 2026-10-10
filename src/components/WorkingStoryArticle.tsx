import type { WorkingStory } from '@/content/working-stories';
import { workingStoryPath } from '@/content/working-stories';
import JsonLd from './JsonLd';
import MarkdownContent from './MarkdownContent';
import MediaPanel from './MediaPanel';
import PageHeader from './PageHeader';
import { SITE_URL } from '@/lib/seo';
import Link from 'next/link';
import styles from './WorkingStoryArticle.module.css';

export default function WorkingStoryArticle({ story, related }: { story: WorkingStory; related: WorkingStory[] }) {
  const url = `${SITE_URL}${workingStoryPath(story)}`;
  return (
    <div className="route-native-writing grid gap-8">
      <JsonLd id="jsonld-working-story" data={{
        '@context': 'https://schema.org', '@type': 'Article', headline: story.title,
        inLanguage: story.language, description: story.summary, datePublished: story.date,
        dateModified: story.updatedAt || story.date, url, mainEntityOfPage: url,
        ...(story.coverImage ? { image: `${SITE_URL}${story.coverImage.src}` } : {}),
        author: { '@type': 'Person', '@id': `${SITE_URL}/#person`, name: 'Anton Biletskyi-Volokh' },
        publisher: { '@type': 'Organization', name: 'ABVX' },
        isPartOf: { '@type': 'CollectionPage', name: 'Working Stories', '@id': `${SITE_URL}/writing/working-stories#collection` },
      }} />
      <PageHeader eyebrow="Working Stories" title={story.title} summary={story.summary}>
        <Link className="editorial-section-link" href="/writing/working-stories">Working Stories <span aria-hidden="true">→</span></Link>
      </PageHeader>
      <div className="native-writing-article__meta">
        <span>{story.date}</span>
        {story.topics.map((topic) => <span key={topic}>{topic}</span>)}
      </div>
      <div className={`native-writing-article__body working-story-body ${styles.body}`}>
        {story.coverImage ? <MediaPanel image={story.coverImage} title={story.title} variant="writing" priority /> : null}
        {story.body.split(/(?=^## )/m).map((section, index) => {
          const heading = section.match(/^## (.+)\n/)?.[1];
          const illustrations = (story.illustrations || []).filter((image) => image.afterHeading === heading);
          return (
            <section key={index}>
              <MarkdownContent>{section}</MarkdownContent>
              {illustrations.map((image) => (
                <div className={`working-story-illustration ${styles.illustration}`} key={image.src}>
                  <MediaPanel image={image} title={story.title} variant="writing" />
                  <p className={styles.caption}>{image.caption}</p>
                </div>
              ))}
              {illustrations.length && story.caseStudy && heading === story.illustrations?.[0]?.afterHeading ? (
                <p className="content-markdown"><a href={story.caseStudy.url} target="_blank" rel="noopener noreferrer">{story.caseStudy.label} <span aria-hidden="true">↗</span></a></p>
              ) : null}
            </section>
          );
        })}
      </div>
      {related.length ? (
        <aside>
          <h2>More Working Stories from this project</h2>
          <div className="link-strip">
            {related.map((candidate) => <Link key={candidate.story_id} href={workingStoryPath(candidate)}>{candidate.title}</Link>)}
          </div>
        </aside>
      ) : null}
    </div>
  );
}
