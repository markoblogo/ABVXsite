import collection from '../../../../content/kitchen-notes.json';
import { getLiveNativeWritingItems } from '@/lib/live-writing';
export const dynamic = 'force-dynamic';
import JsonLd from '@/components/JsonLd';
import PageHeader from '@/components/PageHeader';
import WritingArchiveRow from '@/components/WritingArchiveRow';
import { collectionPageJsonLd, defaultOgImage, itemListJsonLd, metadataWithImage, SITE_URL } from '@/lib/seo';
import Link from 'next/link';

export const metadata = metadataWithImage({title: collection.title, description: collection.summary, canonicalPath: collection.canonicalPath, image: defaultOgImage});
export default async function KitchenNotesPage() {
  const notes = (await getLiveNativeWritingItems()).filter(item => item.collection === collection.id && item.status === 'live');
  return <div className="route-writing grid gap-8">
    <JsonLd id="jsonld-kitchen-notes" data={collectionPageJsonLd({id: `${SITE_URL}${collection.canonicalPath}#collection`, name: collection.title, description: collection.summary, url: `${SITE_URL}${collection.canonicalPath}`})} />
    <JsonLd id="jsonld-kitchen-notes-list" data={itemListJsonLd({id: `${SITE_URL}${collection.canonicalPath}#notes`,name:collection.title,items:notes.map(item => ({name:item.title,url:`${SITE_URL}/writing/${item.slug}`,type:item.type === 'recipe' ? 'Recipe' : 'Article'}))})} />
    <PageHeader eyebrow="Writing" title={collection.title} summary={collection.summary}>
      <Link className="editorial-section-link" href="/writing">All Writing <span aria-hidden="true">→</span></Link>
    </PageHeader>
    <div className="writing-archive-list">{notes.map(item => <WritingArchiveRow key={item.id} title={item.title} excerpt={item.summary} href={`/writing/${item.slug}`} source="abvx" date={item.publishedAt} />)}</div>
  </div>;
}
