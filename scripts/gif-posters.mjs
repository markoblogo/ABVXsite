import {readdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {gifPoster} from '../src/content/gif-poster.mjs';
function* gifs(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){const file=join(dir,entry.name);if(entry.isDirectory())yield* gifs(file);else if(entry.isFile()&&file.endsWith('.gif'))yield file;}}
for(const file of gifs('public/media')){const bytes=await gifPoster(readFileSync(file)),target=file+'.poster.webp';if(!existsSync(target)||!readFileSync(target).equals(bytes))writeFileSync(target,bytes);}
