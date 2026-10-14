import { catalogueTypes } from './publication-metadata.mjs';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseMarkdownSource } from '../src/content/markdown-source.mjs';

const generated = new Set(['content/writing-discovery.json','content/catalogue-discovery.json','public/content-index.json','public/llms.txt']);
const native = /^content\/(writing|working-stories|work|books)\/[^/]+\.md$/;
const full = reason => ({profile:'full', reason, routes:[], hubs:[]});
export function publicationScope(base, head='HEAD', cwd=process.cwd(), includeWorking=false) {
 if (!/^[a-f0-9]{40}$/i.test(base || '')) return full('unknown-base');
 try {
  const git=(...args)=>execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']});
  const changed=new Map();
  const collect=(args)=>{
   const fields=git(...args).split('\0').filter(Boolean);
   for(let i=0;i<fields.length;i+=2) changed.set(fields[i+1],fields[i]);
  };
  collect(['diff','--no-renames','--name-status','-z',base,head,'--']);
  if(includeWorking) {
   collect(['diff','--no-renames','--name-status','-z','HEAD','--']);
   for(const file of git('ls-files','--others','--exclude-standard','-z').split('\0').filter(Boolean)) changed.set(file,'A');
  }
  const routes=new Set(), hubs=new Set(['/']), families=new Set();
  for(const [file,status] of changed) {
   if(!['A','M'].includes(status)) return full('deletion-or-special-change');
   if(generated.has(file)) continue;
   if(/^public\/media\/.+\.(?:png|jpe?g|webp)$/i.test(file)&&status==='A') continue;
   const match=file.match(native);
   if(!match) return full('shared-code-or-other-content');
   const {data}=parseMarkdownSource(readFileSync(path.join(cwd,file),'utf8'));
   const date=data.publishedAt || data.date;
   if(data.visibility!=='public'||(match[1]==='writing'&&data.status!=='live')||(['work','books'].includes(match[1])&&!['live','released','building','research','archive'].includes(data.status))||!(Date.parse(date)<=Date.now())||!/^[-a-z0-9]+$/.test(data.slug||'')) return full('non-live-or-invalid-publication');
   if(status==='M') {
    const previous=parseMarkdownSource(git('show',`${base}:${file}`)).data;
    if(previous.slug!==data.slug || previous.collection!==data.collection || previous.canonicalPath!==data.canonicalPath || previous.primarySection!==data.primarySection || JSON.stringify(previous.appearsIn)!==JSON.stringify(data.appearsIn)) return full('route-or-collection-change');
   }
   const catalogue=['work','books'].includes(match[1]);families.add(catalogue?'catalogue':'writing');
   if(catalogue && !catalogueTypes[match[1]].has(data.type)) return full('unsupported-catalogue-type');
   if(catalogue && ((data.primarySection||(match[1]==='books'?'books':'systems'))!==(match[1]==='books'?'books':'systems') || (data.appearsIn!==undefined&&!Array.isArray(data.appearsIn)) || (data.appearsIn||[]).some(section=>section!==(match[1]==='books'?'books':'systems')))) return full('unsupported-catalogue-placement');
   const route=catalogue?`/${match[1]}/${data.slug}`:`/writing/${match[1]==='working-stories'?'working-stories/':''}${data.slug}`;
   if(data.canonicalPath&&data.canonicalPath!==route) return full('custom-route');
   routes.add(route);hubs.add(catalogue?(match[1]==='books'?'/books':'/systems'):'/writing');
   if(!catalogue) hubs.add('/writing/archive');
   if(match[1]==='working-stories') hubs.add('/writing/working-stories');
   if(data.collection==='kitchen-notes') hubs.add('/writing/kitchen-notes');
  }
  if(!routes.size) return full('no-native-publication');
  if(families.size!==1) return full('mixed-publication-families');
  const catalogue=families.has('catalogue');
  if(changed.has(catalogue?'content/writing-discovery.json':'content/catalogue-discovery.json')) return full('unrelated-discovery-change');
  return {profile:catalogue?'catalogue-v1':'publication-v1',reason:catalogue?'catalogue-content-only':'native-content-only',base,routes:[...routes].sort(),hubs:[...hubs].sort()};
 } catch {return full('history-or-content-unavailable');}
}
export function publicationBase(cwd=process.cwd()) {
 try{return execFileSync('git',['merge-base','origin/main','HEAD'],{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();}catch{return undefined;}
}
