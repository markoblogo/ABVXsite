import Link from 'next/link';
import SectionPanel from './SectionPanel';
import {getLiveWritingBundle} from '@/lib/live-writing-discovery';
import {readingContinuation} from '@/lib/reading-continuation.mjs';
import type {NativeWriting} from '@/content/types';

export function WritingSubscription() {
 return <SectionPanel title="Stay in touch">
  <p>More essays and updates on ABVX Substack.</p>
  <a href="https://abvx.substack.com/" target="_blank" rel="noopener noreferrer">Read and subscribe on Substack →</a>
 </SectionPanel>;
}
export default async function ReadingContinuation({item}:{item:NativeWriting}) {
 const {native,index}=await getLiveWritingBundle();
 const visible=new Set<string>(index.items.filter((entry:{canonicalUrl:string})=>entry.canonicalUrl.startsWith('https://abvx.xyz/writing/')).map((entry:{canonicalUrl:string})=>new URL(entry.canonicalUrl).pathname));
 const {related,previous,next,first}=readingContinuation(item,native,visible) as {related:NativeWriting[];previous?:NativeWriting;next?:NativeWriting;first?:NativeWriting};
 return <>
  <SectionPanel title="Keep reading">
   {previous||next||first?.slug!==item.slug&&first ? <nav aria-label="Psychology Notebook sequence"><ul>
    {previous ? <li><Link href={'/writing/'+previous.slug}>Previous: {previous.title}</Link></li>:null}
    {next ? <li><Link href={'/writing/'+next.slug}>Next: {next.title}</Link></li>:null}
    {first&&first.slug!==item.slug ? <li><Link href={'/writing/'+first.slug}>Start with the first available notebook</Link></li>:null}
   </ul></nav>:null}
   {related.length ? <ul>{related.map(post=><li key={post.slug}><Link href={'/writing/'+post.slug}>{post.title}</Link></li>)}</ul>:null}
   <Link href={item.collection==='kitchen-notes'?'/writing/kitchen-notes':'/writing/archive'}>{item.collection==='kitchen-notes'?'More Kitchen Notes':'Explore the writing archive'} →</Link>
  </SectionPanel>
  <WritingSubscription />
 </>;
}
