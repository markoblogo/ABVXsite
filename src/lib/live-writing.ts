import {cache} from 'react';
import {getNativeWritingItems} from '@/content';
import {nativeWritingFromSource} from '@/content/file-loader';
import {currentSources} from '@/content/runtime-writing.mjs';
import {configuredWritingStore} from '@/content/runtime-writing-store.mjs';

export const runtimeWritingEnabled = () => process.env.RUNTIME_WRITING_ENABLED === '1';
// Request-local consistency: every surface in one render sees one complete snapshot.
// A store error propagates: never resurrect withdrawn content from the bundled archive.
export const getLiveWritingState = cache(async () => runtimeWritingEnabled()
  ? (await configuredWritingStore().load()).snapshot : null);
export const getLiveNativeWritingItems = cache(async () => {
  const state=await getLiveWritingState();
  return state ? currentSources(state).map(nativeWritingFromSource).sort((a,b)=>
    (b.publishedAt || '').localeCompare(a.publishedAt || '') || a.slug.localeCompare(b.slug)) : getNativeWritingItems();
});
export async function getLiveNativeWritingBySlug(slug: string) {
  return (await getLiveNativeWritingItems()).find(item=>item.slug===slug);
}
