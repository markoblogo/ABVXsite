import {WritingSubscription} from '@/components/ReadingContinuation';
import DocumentLanguage from '@/components/DocumentLanguage';
import { getLiveWritingState } from '@/lib/live-writing';
import { getRelatedWorkingStories, getWorkingStoryBySlug, workingStoryPath } from '@/content/working-stories';
import WorkingStoryArticle from '@/components/WorkingStoryArticle';
import { defaultOgImage, imageMetadata, metadataWithImage } from '@/lib/seo';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

// The root layout reads request headers; an empty static-params fallback cannot render it.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const story = await getWorkingStoryBySlug(slug);
  if (!story) notFound();
  return metadataWithImage({
    title: story.seoTitle || story.title, description: story.seoDescription || story.summary, canonicalPath: workingStoryPath(story), image: imageMetadata(story.coverImage, defaultOgImage, 'page'), type: 'article',
  });
}

export default async function WorkingStoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getWorkingStoryBySlug(slug);
  if (!story) notFound();
  return <div data-content-revision={(await getLiveWritingState())?.records[story.slug]?.currentRevision}>
    <DocumentLanguage key={story.slug+':'+story.language} languageOverride={story.language} />
    <WorkingStoryArticle story={story} related={await getRelatedWorkingStories(story)} />
    <WritingSubscription />
  </div>;
}
