// Stable across content/feed updates; changes when executable engine inputs change.
import {readdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
const files=['src/content/catalogue-redirects.json','package-lock.json','next.config.ts',...['runtime-writing.mjs','runtime-writing-engine.mjs','runtime-writing-verify.mjs','publication-metadata.mjs'].map(x=>'scripts/'+x)];
function visit(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){const path=join(dir,entry.name);if(entry.isDirectory())visit(path);else if(/\.(tsx?|mjs|css)$/.test(entry.name))files.push(path);}}
visit('src');const hash=createHash('sha256');
for(const file of files.sort()){hash.update(file+'\0');hash.update(readFileSync(file));hash.update('\0');}
const output=JSON.stringify({schemaVersion:1,engineVersion:hash.digest('hex'),inputCount:files.length},null,2)+'\n',path='content/runtime-writing-engine.json';
if(process.argv.includes('--check')){if(readFileSync(path,'utf8')!==output)throw Error('Runtime engine manifest is stale');}
else{writeFileSync(path,output);console.log('Runtime Writing engine manifest refreshed.');}
