import type { WorkingStory } from '@/content/working-stories';
import { workingStoryPath } from '@/content/working-stories';
import JsonLd from './JsonLd';
import MarkdownContent from './MarkdownContent';
import PageHeader from './PageHeader';
import { SITE_URL } from '@/lib/seo';
import Link from 'next/link';

export default function WorkingStoryArticle({ story, related }: { story: WorkingStory; related: WorkingStory[] }) {
  const url = `${SITE_URL}${workingStoryPath(story)}`;
  return (
    <div className="route-native-writing grid gap-8">
      <JsonLd id="jsonld-working-story" data={{
        '@context': 'https://schema.org', '@type': 'Article', headline: story.title,
        inLanguage: story.language, description: story.summary, datePublished: story.date,
        dateModified: story.updatedAt || story.date, url, mainEntityOfPage: url,
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
      <MarkdownContent className="native-writing-article__body">{story.body}</MarkdownContent>
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
