import {cache} from 'react';
import {createContentAccess} from '@/content';
import {bookFromSource,workFromSource,seriesFromSource,readNativeWritingFiles} from '@/content/file-loader';
import {getLiveWritingState} from './live-writing';
import {parseMarkdownSource} from '@/content/markdown-source.mjs';
import {readLegacyCatalogueSources,mergeCatalogueSources,catalogueFamily,catalogueConfiguration} from '@/content/runtime-catalogue.mjs';
import chronology from '../../content/catalogue-discovery.json';
export const getLiveCatalogue = cache(async()=>{
 const state=await getLiveWritingState();
 const sources=state?mergeCatalogueSources(state,readLegacyCatalogueSources()):readLegacyCatalogueSources();
 const visible=sources.filter(source=>!['private','draft'].includes(parseMarkdownSource(source).data.visibility));
 const family=(name:string)=>visible.filter(source=>catalogueFamily(parseMarkdownSource(source).data)===name);
 const times={...chronology,items:[...chronology.items]};
 if(state)for(const source of visible){const d=parseMarkdownSource(source).data,r=state.records[d.slug],kind=catalogueFamily(d);if(r&&r.firstAddedAt){times.items=times.items.filter(x=>!(x.slug===d.slug&&x.kind===kind));times.items.push({kind:kind!,slug:d.slug,addedAt:r.firstAddedAt,basis:'observed'});}}
 return {...createContentAccess({readBookFiles:()=>family('books').map(bookFromSource),readWorkFiles:()=>family('work').map(workFromSource),readSeriesFiles:()=>family('series').map(seriesFromSource),readNativeWritingFiles},times),...catalogueConfiguration(visible,Object.keys(state?.records||{}))};
});
