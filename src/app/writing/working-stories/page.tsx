import series from '../../../../content/working-stories.json';
import { getWorkingStories, workingStoryPath } from '@/content/working-stories';
import JsonLd from '@/components/JsonLd';
import PageHeader from '@/components/PageHeader';
import WritingArchiveRow from '@/components/WritingArchiveRow';
import { collectionPageJsonLd, defaultOgImage, itemListJsonLd, metadataWithImage, SITE_URL } from '@/lib/seo';
import Link from 'next/link';

export const metadata = metadataWithImage({
  title: series.title, description: series.summary, canonicalPath: series.canonicalPath, image: defaultOgImage,
});

export default function WorkingStoriesPage() {
  const stories = getWorkingStories();
  return (
    <div className="route-writing grid gap-8">
      <JsonLd id="jsonld-working-stories" data={collectionPageJsonLd({ id: `${SITE_URL}${series.canonicalPath}#collection`, name: series.title, description: series.summary, url: `${SITE_URL}${series.canonicalPath}` })} />
      <JsonLd id="jsonld-working-stories-list" data={itemListJsonLd({
        id: `${SITE_URL}${series.canonicalPath}#stories`, name: series.title,
        items: stories.map((story) => ({ name: story.title, url: `${SITE_URL}${workingStoryPath(story)}`, type: 'Article' })),
      })} />
      <PageHeader eyebrow="Writing" title={series.title} summary={series.summary}>
        <Link className="editorial-section-link" href="/writing">All Writing <span aria-hidden="true">→</span></Link>
      </PageHeader>
      {stories.length ? (
        <div className="writing-archive-list">
          {stories.map((story) => <WritingArchiveRow key={story.story_id} title={story.title} excerpt={story.summary} href={workingStoryPath(story)} source="abvx" date={story.date} />)}
        </div>
      ) : <p>{series.emptyState}</p>}
    </div>
  );
}
