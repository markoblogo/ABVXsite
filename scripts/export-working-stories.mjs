import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { readWorkingStories, workingStoriesExport } from '../src/content/working-stories-lib.mjs';

const directory = path.join(process.cwd(), 'exports');
const { manuscript, manifest } = workingStoriesExport(readWorkingStories());
mkdirSync(directory, { recursive: true });
writeFileSync(path.join(directory, 'working-stories-manuscript.md'), manuscript);
writeFileSync(path.join(directory, 'working-stories-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Exported ${manifest.length} Working Stories to exports/working-stories-manuscript.md and exports/working-stories-manifest.json.`);
