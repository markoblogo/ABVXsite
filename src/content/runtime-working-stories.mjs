import {readFileSync,readdirSync} from 'node:fs';
import path from 'node:path';
import {parseMarkdownSource} from './markdown-source.mjs';
import {validateWorkingStory} from './working-stories-lib.mjs';

/** Validate an approved public story without mutating its source. */
export function parseAcceptedWorkingStory(source, now = new Date()) {
  if (typeof source !== 'string' || Buffer.byteLength(source) > 512_000) throw new Error('Complete source up to 512 KB required');
  const {data, body} = parseMarkdownSource(source);
  const errors = validateWorkingStory(data, body);
  if (data.visibility !== 'public' || data.date > now.toISOString().slice(0, 10)) errors.push('Public non-future Working Story required');
  for (const match of body.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    if (!/^(?:https?:\/\/|mailto:|\/(?!\/)|#)/i.test(match[1])) errors.push('Unsupported link protocol');
  }
  if (errors.length) throw new Error(errors.join('; '));
  return {data, body};
}

export function readLegacyStorySources(){return readdirSync('content/working-stories').filter(f=>f.endsWith('.md')&&!f.startsWith('_')).map(f=>readFileSync(path.join('content/working-stories',f),'utf8')).filter(source=>parseMarkdownSource(source).data.visibility==='public');}
