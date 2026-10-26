import {getLiveWritingIndex} from '@/lib/live-writing-discovery';
export const dynamic = 'force-dynamic';
import { writingArchiveItems } from '@/lib/writing-archive.mjs';
import PageHeader from '@/components/PageHeader';
import WritingArchiveRow from '@/components/WritingArchiveRow';
import JsonLd from '@/components/JsonLd';
import { collectionPageJsonLd, defaultOgImage, itemListJsonLd, metadataWithImage, SITE_URL } from '@/lib/seo';
import Link from 'next/link';

const description='All published ABVX articles, Working Stories and video pages in one complete alphabetical archive, including older material beyond the recent feed.';
export const metadata=metadataWithImage({title:'Complete Writing Archive',description,canonicalPath:'/writing/archive',image:defaultOgImage});
export default async function WritingArchivePage() {
 const items=writingArchiveItems(await getLiveWritingIndex());
 return <div className="route-writing grid gap-8">
  <JsonLd id="jsonld-writing-archive" data={collectionPageJsonLd({id:`${SITE_URL}/writing/archive#collection`,name:'Complete Writing Archive',description,url:`${SITE_URL}/writing/archive`})}/>
  <JsonLd id="jsonld-writing-archive-list" data={itemListJsonLd({id:`${SITE_URL}/writing/archive#items`,name:'Complete Writing Archive',items:items.map(item=>({name:item.title,url:item.url,type:'WebPage'}))})}/>
  <PageHeader eyebrow="Writing" title="Complete Writing Archive" summary={description}>
   <Link className="editorial-section-link" href="/writing">Latest writing <span aria-hidden="true">→</span></Link>
  </PageHeader>
  <div className="writing-archive-list">{items.map(item=><WritingArchiveRow key={item.url} title={item.title} href={item.url} source={item.source}/>)}</div>
 </div>;
}
