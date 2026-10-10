// Independent site evidence; no private OS runtime dependency.
import { execFileSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
const hash=value=>createHash('sha256').update(value).digest('hex');
export function editorialTreeDigest(root=process.cwd()) {
 root=realpathSync(root);
 const names=[...new Set(execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean))].sort();
 const refs=names.map(name=>{
  const file=path.join(root,name);if(realpathSync(file)!==file)throw Error('Symlink source cannot qualify release evidence');
  return {path:name,sha256:hash(readFileSync(file))};
 });
 // Match canonical JSON keys used by the independent OS verifier.
 return hash(JSON.stringify(refs));
}
