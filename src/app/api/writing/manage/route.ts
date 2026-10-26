import {readLegacyWritingSources} from '@/content/file-loader';
import engine from '../../../../../content/runtime-writing-engine.json';
import baseline from '../../../../../public/content-index.json';
import discovery from '../../../../../content/writing-discovery.json';
import {projectWritingIndex} from '@/content/runtime-writing-discovery.mjs';
import {mergeWritingSources} from '@/content/runtime-writing.mjs';
import {createWritingHandler} from '@/content/runtime-writing-api.mjs';
import {configuredWritingStore} from '@/content/runtime-writing-store.mjs';
export const dynamic='force-dynamic';
export const runtime='nodejs';
function handle(request: Request){
 return createWritingHandler({store:configuredWritingStore(),token:process.env.RUNTIME_WRITING_PUBLISH_TOKEN,enabled:process.env.RUNTIME_WRITING_ENABLED==='1',engineVersion:engine.engineVersion,legacySources:readLegacyWritingSources(),projectIndex:(snapshot: Parameters<typeof mergeWritingSources>[0])=>projectWritingIndex(mergeWritingSources(snapshot,readLegacyWritingSources()),baseline,discovery)})(request);
}
export const GET=handle;
export const POST=handle;
