import BreadcrumbNav from '@/components/BreadcrumbNav';
import JsonLd from '@/components/JsonLd';
import MarkdownContent from '@/components/MarkdownContent';
import PageHeader from '@/components/PageHeader';
import { getEditorialArticle, getEditorialArticles } from '@/content/editorials';
import { defaultOgImage, metadataWithImage, SITE_URL } from '@/lib/seo';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

type PageProps = { params: Promise<{ section: string; slug: string }> };

export function generateStaticParams() {
  return getEditorialArticles().map(({ section, slug }) => ({ section, slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { section, slug } = await params;
  const article = getEditorialArticle(section, slug);
  if (!article) return { title: 'Editorial' };

  const metadata = metadataWithImage({
    title: article.title,
    description: article.summary,
    canonicalPath: article.href,
    image: defaultOgImage,
    type: 'article',
  });
  if (!article.translationGroup) return metadata;

  const languages = Object.fromEntries(
    getEditorialArticles()
      .filter((translation) => translation.translationGroup === article.translationGroup && translation.language)
      .map((translation) => [translation.language!, `${SITE_URL}${translation.href}`]),
  );
  return { ...metadata, alternates: { ...metadata.alternates, languages } };
}

export default async function EditorialArticlePage({ params }: PageProps) {
  const { section, slug } = await params;
  const article = getEditorialArticle(section, slug);
  if (!article) notFound();

  const canonicalUrl = `${SITE_URL}${article.href}`;

  return (
    <div className="route-editorial grid gap-8">
      <JsonLd
        id={`jsonld-editorial-${section}`}
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: article.title,
          description: article.summary,
          mainEntityOfPage: canonicalUrl,
          isPartOf: { '@id': `${SITE_URL}/#website` },
          author: { '@id': `${SITE_URL}/#person` },
          publisher: { '@id': `${SITE_URL}/#organization` },
        }}
      />
      <BreadcrumbNav
        items={[
          { label: article.sectionTitle, href: `/${article.section}` },
          { label: article.title },
        ]}
      />
      <article lang={article.language || 'en'}>
        <PageHeader eyebrow={`${article.sectionTitle} · Editorial`} title={article.title} summary={article.summary} />
        <MarkdownContent className="editorial-article-body" headingOffset={0}>
          {article.body}
        </MarkdownContent>
      </article>
    </div>
  );
}
