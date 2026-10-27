import test from 'node:test';
import assert from 'node:assert/strict';
import { checkVideoAvailability, updateVideoAvailability, scanVideoAvailability } from '../scripts/youtube-availability.mjs';

const html = response => `<script>var ytInitialPlayerResponse = ${JSON.stringify(response)};</script>`;
const fetchResponse = body => async () => ({ ok: true, text: async () => body });
const removed = html({playabilityStatus:{status:'ERROR',errorScreen:{playerInterstitialRenderer:{content:{interstitialViewModel:{description:{content:'This video has been removed by the uploader'}}}}}}});

test('only explicit YouTube removal or private status suppresses a video; errors stay unknown', async () => {
  assert.equal(await checkVideoAvailability('NewVideo001', fetchResponse(removed)), 'removed');
  assert.equal(await checkVideoAvailability('NewVideo001', fetchResponse(html({playabilityStatus:{status:'ERROR',reason:'Video unavailable'}}))), 'unknown');
  assert.equal(await checkVideoAvailability('NewVideo001', async () => ({ok:false,status:404})), 'unknown');
  assert.equal(await checkVideoAvailability('NewVideo001', async () => {throw Error('offline')}), 'unknown');
  assert.equal(await checkVideoAvailability('NewVideo001', fetchResponse(html({playabilityStatus:{status:'OK'},videoDetails:{videoId:'NewVideo001'}}))), 'available');
});

test('the rotating scan covers old records and checks new records immediately', async () => {
 const records = Array.from({length: 16}, (_, i) => ({source:'youtube',url:`https://www.youtube.com/watch?v=video${String(i).padStart(6,'0')}`}));
 const seen = new Set();
 const fetcher = async url => { seen.add(new URL(url).searchParams.get('v')); return {ok:false}; };
 await scanVideoAvailability({version:1,items:records}, [], 0, fetcher);
 await scanVideoAvailability({version:1,items:records}, [], 900000, fetcher);
 assert.equal(seen.size,16);
 seen.clear();
 await scanVideoAvailability({version:1,items:records}, ['video000015'], 0, fetcher);
 assert.ok(seen.has('video000015'));
});

test('availability changes preserve metadata and unknown checks retain prior state', () => {
 const registry={version:1,items:[{url:'https://www.youtube.com/watch?v=NewVideo001',source:'youtube',addedAt:'original'}]};
 const hidden=updateVideoAvailability(registry,new Map([['NewVideo001','removed']]));
 assert.equal(hidden.items[0].youtubeAvailability,'removed');
 assert.deepEqual(updateVideoAvailability(hidden,new Map([['NewVideo001','unknown']])),hidden);
 const restored=updateVideoAvailability(hidden,new Map([['NewVideo001','available']]));
 assert.equal(restored.items[0].youtubeAvailability,undefined);
 assert.equal(restored.items[0].addedAt,'original');
});
