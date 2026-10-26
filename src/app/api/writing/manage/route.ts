import engine from '../../../../../content/runtime-writing-engine.json';
import baseline from '../../../../../public/content-index.json';
import discovery from '../../../../../content/writing-discovery.json';
import {projectWritingIndex} from '@/content/runtime-writing-discovery.mjs';
import {currentSources} from '@/content/runtime-writing.mjs';
import {createWritingHandler} from '@/content/runtime-writing-api.mjs';
import {configuredWritingStore} from '@/content/runtime-writing-store.mjs';
export const dynamic='force-dynamic';
export const runtime='nodejs';
function handle(request: Request){
 return createWritingHandler({store:configuredWritingStore(),token:process.env.RUNTIME_WRITING_PUBLISH_TOKEN,enabled:process.env.RUNTIME_WRITING_ENABLED==='1',engineVersion:engine.engineVersion,projectIndex:(snapshot: Parameters<typeof currentSources>[0])=>projectWritingIndex(currentSources(snapshot),baseline,discovery)})(request);
}
export const GET=handle;
export const POST=handle;
