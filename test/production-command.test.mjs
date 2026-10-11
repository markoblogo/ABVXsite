import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
test('real production npm command preserves --base and the public QA URL',()=>{
 const root=mkdtempSync(path.join(tmpdir(),'abvx-production-command-'));
 try {
  const scripts=JSON.parse(readFileSync('package.json','utf8')).scripts;
  mkdirSync(path.join(root,'scripts'));writeFileSync(path.join(root,'package.json'),JSON.stringify({name:'fixture',scripts:{'content:production-check':scripts['content:production-check'],'qa:seo':scripts['qa:seo']}}));
  writeFileSync(path.join(root,'scripts/seo-discovery-check.mjs'),"console.log('ARGUMENT_PROOF='+JSON.stringify({args:process.argv.slice(2),base:process.env.QA_BASE_URL}));");
  const sha='a'.repeat(40),output=execFileSync('npm',['run','content:production-check','--','--base',sha],{cwd:root,encoding:'utf8'});
  const proof=JSON.parse(output.split('\n').find(line=>line.startsWith('ARGUMENT_PROOF=')).slice(15));
  assert.deepEqual(proof,{args:['--base',sha],base:'https://abvx.xyz'});
 }finally{rmSync(root,{recursive:true,force:true});}
});
