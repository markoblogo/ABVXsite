// Independent site evidence; no private OS runtime dependency.
import { execFileSync } from 'node:child_process';
import { readFileSync, realpathSync, lstatSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
const hash=value=>createHash('sha256').update(value).digest('hex');
export function editorialTreeDigest(root=process.cwd()) {
 root=realpathSync(root);
 const names=[...new Set(execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean))].sort();
 const refs=names.map(name=>{
  const file=path.join(root,name);let stat;try{stat=lstatSync(file);}catch(error){if(error.code==='ENOENT')return {mode:'deleted',path:name,sha256:null};throw error;}if(realpathSync(file)!==file)throw Error('Symlink source cannot qualify release evidence');
  return {mode:stat.mode&0o111?'100755':'100644',path:name,sha256:hash(readFileSync(file))};
 });
 // Match canonical JSON keys used by the independent OS verifier.
 return hash(JSON.stringify(refs));
}
