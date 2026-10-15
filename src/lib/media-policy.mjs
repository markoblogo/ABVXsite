// Shared by the browser CSP, publication preflight and release QA.
export const mediaSources=Object.freeze(["'self'",'https://github.com','https://release-assets.githubusercontent.com']);
/** @param {string} value @param {string} [base] */
export function isAllowedAudioUrl(value,base='https://abvx.xyz') {
 if(typeof value!=='string'||!value.trim())return false;
 try{
  const url=new URL(value,base);
  if(url.username||url.password)return false;
  return (['https:','http:'].includes(url.protocol)&&url.origin===new URL(base).origin)||mediaSources.includes(url.origin);
 }catch{return false;}
}
