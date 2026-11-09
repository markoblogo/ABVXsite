import sharp from 'sharp';

// Decode one settled frame under the same pixel bound as uploaded images.
export async function gifPoster(bytes) {
 const options={limitInputPixels:32_000_000};
 const meta=await sharp(bytes,options).metadata();
 const pages=meta.pages||1;
 if(meta.format!=='gif'||pages>500||(meta.width||0)*(meta.pageHeight||meta.height||0)*pages>128_000_000)throw Error('GIF exceeds poster decode limits');
 return sharp(bytes,{...options,page:pages-1,pages:1}).webp({quality:90}).toBuffer();
}
