import { getRelatedWorkingStories, getWorkingStories, getWorkingStoryBySlug, workingStoryPath } from '@/content/working-stories';
import WorkingStoryArticle from '@/components/WorkingStoryArticle';
import { defaultOgImage, metadataWithImage } from '@/lib/seo';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return getWorkingStories().map((story) => ({ slug: story.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const story = getWorkingStoryBySlug(slug);
  if (!story) notFound();
  return metadataWithImage({
    title: story.title, description: story.summary, canonicalPath: workingStoryPath(story), image: defaultOgImage, type: 'article',
  });
}

export default async function WorkingStoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = getWorkingStoryBySlug(slug);
  if (!story) notFound();
  return <WorkingStoryArticle story={story} related={getRelatedWorkingStories(story)} />;
}
