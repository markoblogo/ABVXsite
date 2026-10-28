import {readLegacyCatalogueSources,mergeCatalogueSources,projectCatalogueIndex,projectCatalogueLlms} from '@/content/runtime-catalogue.mjs';
import {parseMarkdownSource} from '@/content/markdown-source.mjs';
import {cache} from 'react';
import type {NativeWriting} from '@/content/types';
import {getNativeWritingItems} from '@/content';
import {nativeWritingFromSource,readLegacyWritingSources} from '@/content/file-loader';
import {readFileSync} from 'node:fs';
import baseline from '../../public/content-index.json';
import discovery from '../../content/writing-discovery.json';
import {getLiveWritingState} from './live-writing';
import {currentSources,mergeWritingSources,explicitlyPublishedSlugs} from '@/content/runtime-writing.mjs';
import {projectWritingIndex,projectWritingLlms} from '@/content/runtime-writing-discovery.mjs';
export const getLiveWritingBundle=cache(async()=>{
 const state=await getLiveWritingState();
 const sources=state?mergeWritingSources(state,readLegacyWritingSources()):null;
 const native: NativeWriting[]=sources?sources.map(source=>{const item=nativeWritingFromSource(source);return {...item,addedAt:state.records[item.slug]?.firstAddedAt||undefined};}):getNativeWritingItems();
 return {native,index:sources?projectCatalogueIndex(projectWritingIndex(sources,baseline,discovery,Date.now(),explicitlyPublishedSlugs(state),currentSources(state).filter(source=>parseMarkdownSource(source).data.type==='working-story'),Object.keys(state.records)),mergeCatalogueSources(state,readLegacyCatalogueSources()),state):baseline};
});
export const getLiveWritingIndex=cache(async()=>(await getLiveWritingBundle()).index);
export async function getLiveWritingLlms(){
 const state=await getLiveWritingState();
 const text=readFileSync(process.cwd()+'/public/llms.txt','utf8');
 if(!state)return text;
 const index=await getLiveWritingIndex();
 return projectCatalogueLlms(projectWritingLlms(text,index),index,state);
}
