export const catalogueTypes={work:new Set(['brokerage-platform','trading-platform','market-intelligence','market-infrastructure','market-index','media-resource','hospitality-interface','web-service','tool','plugin','protocol','ai-workflow','language-experiment','book-companion','research','build-log']),books:new Set(['book','translation','free-book','free-edition','companion'])};
// Shared source checks run before expensive build/QA for every content family.
export function publicationMetadataErrors(data) {
 const errors=[];
 for(const key of ['seoTitle','seoDescription']) if(data[key]!==undefined&&(typeof data[key]!=='string'||!data[key].trim())) errors.push(`${key} must be nonempty text`);
 for(const key of ['publishedAt','updatedAt']) {
  const value=data[key];if(value===undefined) continue;
  const shape=typeof value==='string'&&/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value);
  const time=shape?Date.parse(value):NaN;
  const day=shape?Date.parse(value.slice(0,10)):NaN;
  if(!Number.isFinite(time)||!Number.isFinite(day)||new Date(day).toISOString().slice(0,10)!==value.slice(0,10)) errors.push(`${key} must be a real ISO date`);
 }
 if(data.publishedAt&&data.updatedAt&&Date.parse(data.updatedAt)<Date.parse(data.publishedAt)) errors.push('updatedAt cannot precede publishedAt');
 return errors;
}
