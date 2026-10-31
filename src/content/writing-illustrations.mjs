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
 const headings=[],paragraphs=[];let fenced=false,paragraph=[];
 const flush=()=>{if(paragraph.length)paragraphs.push(paragraph.join(' ').trim());paragraph=[];};
 for(const raw of body.replace(/\r\n/g,'\n').split('\n')) {
  const line=raw.trim();
  if(/^```[\w-]*$/.test(line)&&(!fenced||line==='```')){flush();fenced=!fenced;continue;}
  if(fenced)continue;
  const match=line.match(/^#{2,4}\s+(.+)$/);
  if(match){flush();headings.push(match[1].trim());continue;}
  if(!line||/^[-*]\s+/.test(line)||/^\d+[.)]\s+/.test(line)||/^(?:(?:-\s*){3,}|(?:\*\s*){3,}|(?:_\s*){3,})$/.test(line)){flush();continue;}
  paragraph.push(line);
 }
 flush();
 const seen=new Set();
 for(const [index,image] of data.illustrations.entries()) {
  const field=`illustrations[${index}]`;
  if(!image||typeof image!=='object'||Array.isArray(image)){errors.push(field+' must be an image object');continue;}
  for(const key of Object.keys(image))if(!['src','alt','width','height','caption','afterHeading','afterParagraph'].includes(key))errors.push(field+' unsupported field: '+key);
  if(typeof image.src!=='string'||!/^\/media\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(?:png|webp|jpe?g)$/.test(image.src))errors.push(field+' requires a local media path');
  if(seen.has(image.src))errors.push(field+' duplicate illustration');seen.add(image.src);
  for(const key of ['alt','caption'])if(typeof image[key]!=='string'||!image[key].trim())errors.push(field+'.'+key+' is required');
  const anchors=['afterHeading','afterParagraph'].filter(key=>image[key]!==undefined);
  if(anchors.length!==1)errors.push(field+' requires exactly one afterHeading or afterParagraph anchor');
  for(const key of ['width','height'])if(!Number.isInteger(image[key])||image[key]<=0)errors.push(field+'.'+key+' must be a positive integer');
  if(anchors.length===1){
   const key=anchors[0],values=key==='afterHeading'?headings:paragraphs;
   if(typeof image[key]!=='string'||!image[key].trim()||values.filter(value=>value===image[key]).length!==1)errors.push(field+'.'+key+' must match one rendered '+(key==='afterHeading'?'heading':'paragraph'));
  }
 }
 return errors;
}
