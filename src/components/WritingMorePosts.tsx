'use client';

import { useState } from 'react';
import WritingArchiveRow from './WritingArchiveRow';

type ArchivePost={title:string;excerpt?:string;href:string;source:string;date?:string};
export default function WritingMorePosts({posts}:{posts:ArchivePost[]}) {
 const [shown,setShown]=useState(0);
 if(!posts.length) return null;
 return <>
  <div id="more-writing-posts" className="writing-archive-list">{posts.slice(0,shown).map(post=><WritingArchiveRow key={post.href} {...post}/>)}</div>
  {shown<posts.length ? <button type="button" className="writing-more-button" aria-controls="more-writing-posts" onClick={()=>setShown(count=>Math.min(count+30,posts.length))}>More posts <span aria-hidden="true">↓</span></button> : null}
  <p className="sr-only" role="status">{shown ? `${shown} additional posts shown.` : ''}</p>
 </>;
}
