// Only the deployed discovery projection may admit a recommendation.
export function readingContinuation(current, candidates, visibleUrls, now=Date.now()) {
 const admitted=candidates.filter(item=>item.slug!==current.slug&&visibleUrls.has('/writing/'+item.slug)&&(!item.publishedAt||Date.parse(item.publishedAt)<=now)&&((item.language||'en')===(current.language||'en')));
 const explicit=current.relatedSlugs||[];
 const tags=new Set(current.tags||[]);
 const score=item=>explicit.includes(item.slug)?1000-explicit.indexOf(item.slug):((current.collection&&item.collection===current.collection)?100:0)+(item.tags||[]).filter(tag=>tags.has(tag)).length;
 const related=admitted.filter(item=>score(item)>0).sort((a,b)=>score(b)-score(a)||(b.publishedAt||'').localeCompare(a.publishedAt||'')||a.slug.localeCompare(b.slug)).slice(0,3);
 const number=item=>item.tags?.includes('psychology-notebook')?Number(item.slug.match(/^psychology-notebook-(\d+)-/)?.[1]):NaN;
 const n=number(current),sequence=[current,...admitted].filter(item=>Number.isFinite(number(item))).sort((a,b)=>number(a)-number(b));
 return {related,previous:Number.isFinite(n)?sequence.find(item=>number(item)===n-1):undefined,next:Number.isFinite(n)?sequence.find(item=>number(item)===n+1):undefined,first:Number.isFinite(n)?sequence[0]:undefined};
}
