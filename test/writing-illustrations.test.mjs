import test from 'node:test';
import assert from 'node:assert/strict';
import { validateWritingIllustrations } from '../src/content/writing-illustrations.mjs';

test('unsupported prose images fail early with the supported illustration alternative',()=>{
 assert.match(validateWritingIllustrations({},'![Book cover](/media/books/book/cover.webp)').join('\n'),/illustrations.*afterHeading/);
 assert.match(validateWritingIllustrations({},'![Cover][book]\n\n[book]: /media/book.webp').join('\n'),/illustrations/);
});
test('code examples and escaped image punctuation are not treated as rendered prose images',()=>{
 for(const body of ['`![cover](/media/book.webp)`','```md\n![cover](/media/book.webp)\n```','\\![cover](/media/book.webp)','[Book](/books/book)']) assert.deepEqual(validateWritingIllustrations({},body),[]);
});
test('supported metadata remains valid and checks actual heading placement',()=>{
 const image={src:'/media/book.webp',alt:'Book',caption:'Book cover.',width:300,height:200,afterHeading:'Book'};
 assert.deepEqual(validateWritingIllustrations({illustrations:[image]},'## Book\n\nText.'),[]);
 assert.match(validateWritingIllustrations({illustrations:[image]},'## Other').join('\n'),/heading/);
});
test('paragraph anchors require one exact rendered paragraph and exclude code, lists and headings',()=>{
 const image={src:'/media/chart.jpg',alt:'Chart',caption:'Conceptual projection.',width:1280,height:1240,afterParagraph:'An _introductory_ paragraph continued here.'};
 assert.deepEqual(validateWritingIllustrations({illustrations:[image]},'## Section\n\nAn _introductory_ paragraph\ncontinued here.\n\nNext.'),[]);
 for(const body of ['## An _introductory_ paragraph continued here.','- An _introductory_ paragraph continued here.','```md\nAn _introductory_ paragraph continued here.\n```','An _introductory_ paragraph continued here.\n\nAn _introductory_ paragraph continued here.']) assert.match(validateWritingIllustrations({illustrations:[image]},body).join('\n'),/one rendered paragraph/);
 assert.match(validateWritingIllustrations({illustrations:[{...image,afterHeading:'Section'}]},'## Section\n\nAn _introductory_ paragraph continued here.').join('\n'),/exactly one/);
});
