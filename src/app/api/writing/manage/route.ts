import {parseMarkdownSource} from '@/content/markdown-source.mjs';
import {readLegacyStorySources} from '@/content/runtime-working-stories.mjs';
import {currentSources} from '@/content/runtime-writing.mjs';
import {readLegacyWritingSources} from '@/content/file-loader';
import engine from '../../../../../content/runtime-writing-engine.json';
import baseline from '../../../../../public/content-index.json';
import discovery from '../../../../../content/writing-discovery.json';
import {projectWritingIndex} from '@/content/runtime-writing-discovery.mjs';
import {mergeWritingSources,explicitlyPublishedSlugs} from '@/content/runtime-writing.mjs';
import {createWritingHandler} from '@/content/runtime-writing-api.mjs';
import {configuredWritingStore} from '@/content/runtime-writing-store.mjs';
export const dynamic='force-dynamic';
export const runtime='nodejs';
function handle(request: Request){
 return createWritingHandler({store:configuredWritingStore(),token:process.env.RUNTIME_WRITING_PUBLISH_TOKEN,enabled:process.env.RUNTIME_WRITING_ENABLED==='1',engineVersion:engine.engineVersion,legacySources:[...readLegacyWritingSources(),...readLegacyStorySources()],projectIndex:(snapshot: Parameters<typeof mergeWritingSources>[0])=>projectWritingIndex(mergeWritingSources(snapshot,readLegacyWritingSources()),baseline,discovery,Date.now(),explicitlyPublishedSlugs(snapshot),currentSources(snapshot).filter(source=>parseMarkdownSource(source).data.type==='working-story'),Object.keys(snapshot.records))})(request);
}
export const GET=handle;
export const POST=handle;
