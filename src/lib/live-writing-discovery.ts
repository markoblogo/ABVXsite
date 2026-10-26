import {cache} from 'react';
import type {NativeWriting} from '@/content/types';
import {getNativeWritingItems} from '@/content';
import {nativeWritingFromSource,readLegacyWritingSources} from '@/content/file-loader';
import {readFileSync} from 'node:fs';
import baseline from '../../public/content-index.json';
import discovery from '../../content/writing-discovery.json';
import {getLiveWritingState} from './live-writing';
import {mergeWritingSources,explicitlyPublishedSlugs} from '@/content/runtime-writing.mjs';
import {projectWritingIndex,projectWritingLlms} from '@/content/runtime-writing-discovery.mjs';
export const getLiveWritingBundle=cache(async()=>{
 const state=await getLiveWritingState();
 const sources=state?mergeWritingSources(state,readLegacyWritingSources()):null;
 const native: NativeWriting[]=sources?sources.map(source=>{const item=nativeWritingFromSource(source);return {...item,addedAt:state.records[item.slug]?.firstAddedAt||undefined};}):getNativeWritingItems();
 return {native,index:sources?projectWritingIndex(sources,baseline,discovery,Date.now(),explicitlyPublishedSlugs(state)):baseline};
});
export const getLiveWritingIndex=cache(async()=>(await getLiveWritingBundle()).index);
export async function getLiveWritingLlms(){
 const state=await getLiveWritingState();
 const text=readFileSync(process.cwd()+'/public/llms.txt','utf8');
 if(!state)return text;
 return projectWritingLlms(text,await getLiveWritingIndex());
}
