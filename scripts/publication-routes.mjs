import { existsSync,readdirSync } from 'node:fs';
import path from 'node:path';

// Static Writing hubs always own these paths, including isolated packet tests.
export const reservedWritingSlugs=new Set(['archive','kitchen-notes','working-stories','videos']);
export function staticPublicationRoutes(root=process.cwd()) {
 const routes=new Set([...reservedWritingSlugs].map(slug=>'/writing/'+slug));
 function visit(directory,parts=[]) {
  if(!existsSync(directory)) return;
  const entries=readdirSync(directory,{withFileTypes:true});
  if(entries.some(entry=>entry.isFile()&&/^page\.(?:tsx|jsx|js|ts)$/.test(entry.name))) routes.add('/'+parts.join('/'));
  for(const entry of entries) if(entry.isDirectory()&&!entry.name.startsWith('[')&&!entry.name.startsWith('@')) visit(path.join(directory,entry.name),entry.name.startsWith('(')?parts:[...parts,entry.name]);
 }
 visit(path.join(root,'src/app'));
 return routes;
}
