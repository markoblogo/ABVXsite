/** Reuse the local illustration descriptors already used by Working Stories. */
export function validateWritingIllustrations(data, body) {
 const errors=[];
 let code=false;
 for(const raw of body.replace(/\r\n/g,'\n').split('\n')) {
  const line=raw.trim();
  if(/^```[\w-]*$/.test(line)&&(!code||line==='```')){code=!code;continue;}
  if(code)continue;
  const prose=line.replace(/`[^`]+`/g,'');
  if(/(?<!\\)!\[[^\]]*\]/.test(prose)) {
   errors.push('Markdown images are not rendered; use illustrations metadata with afterHeading instead.');break;
  }
 }
 if(data.illustrations===undefined)return errors;
 if(!Array.isArray(data.illustrations))return ['illustrations must be an array'];
 const headings=[];let fenced=false;
 for(const raw of body.replace(/\r\n/g,'\n').split('\n')) {
  if(/^```[\w-]*$/.test(raw.trim())){fenced=!fenced;continue;}
  if(!fenced){const match=raw.trim().match(/^#{2,4}\s+(.+)$/);if(match)headings.push(match[1]);}
 }
 const seen=new Set();
 for(const [index,image] of data.illustrations.entries()) {
  const field=`illustrations[${index}]`;
  if(!image||typeof image!=='object'||Array.isArray(image)){errors.push(field+' must be an image object');continue;}
  for(const key of Object.keys(image))if(!['src','alt','width','height','caption','afterHeading'].includes(key))errors.push(field+' unsupported field: '+key);
  if(typeof image.src!=='string'||!/^\/media\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(?:png|webp|jpe?g)$/.test(image.src))errors.push(field+' requires a local media path');
  if(seen.has(image.src))errors.push(field+' duplicate illustration');seen.add(image.src);
  for(const key of ['alt','caption','afterHeading'])if(typeof image[key]!=='string'||!image[key].trim())errors.push(field+'.'+key+' is required');
  for(const key of ['width','height'])if(!Number.isInteger(image[key])||image[key]<=0)errors.push(field+'.'+key+' must be a positive integer');
  if(headings.filter(heading=>heading===image.afterHeading).length!==1)errors.push(field+'.afterHeading must match one rendered heading');
 }
 return errors;
}
