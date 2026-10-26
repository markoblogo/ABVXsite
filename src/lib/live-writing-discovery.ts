import {cache} from 'react';
import type {NativeWriting} from '@/content/types';
import {getNativeWritingItems} from '@/content';
import {nativeWritingFromSource} from '@/content/file-loader';
import {readFileSync} from 'node:fs';
import baseline from '../../public/content-index.json';
import discovery from '../../content/writing-discovery.json';
import {getLiveWritingState} from './live-writing';
import {currentSources} from '@/content/runtime-writing.mjs';
import {projectWritingIndex,projectWritingLlms} from '@/content/runtime-writing-discovery.mjs';
export const getLiveWritingBundle=cache(async()=>{
 const state=await getLiveWritingState();
 const sources=state?currentSources(state):null;
 const native: NativeWriting[]=sources?sources.map(nativeWritingFromSource):getNativeWritingItems();
 return {native,index:sources?projectWritingIndex(sources,baseline,discovery):baseline};
});
export const getLiveWritingIndex=cache(async()=>(await getLiveWritingBundle()).index);
export async function getLiveWritingLlms(){
 const state=await getLiveWritingState();
 const text=readFileSync(process.cwd()+'/public/llms.txt','utf8');
 if(!state)return text;
 return projectWritingLlms(text,await getLiveWritingIndex());
}
