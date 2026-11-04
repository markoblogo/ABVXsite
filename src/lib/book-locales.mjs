// Description locales do not change the language or identity of the book edition.
export function bookLocalePath(slug, locale = 'en') {
 return `${locale === 'fr' ? '/fr' : ''}/books/${slug}`;
}
export function bookLocaleErrors(data) {
 const value=data.descriptionLocales;
 if(value===undefined)return [];
 const errors=[];
 if(data.type!=='book'||!value||typeof value!=='object'||Array.isArray(value))return ['Book descriptionLocales must be an object on a book'];
 if(!value.en||!value.fr||Object.keys(value).some(k=>!['en','fr'].includes(k)))errors.push('Book descriptions require exactly en and fr');
 for(const [locale,entry] of Object.entries(value)) {
  if(!entry||typeof entry!=='object'||Array.isArray(entry)) {errors.push(`Invalid ${locale} book description`);continue;}
  for(const key of ['summary','body','seoTitle','seoDescription'])if(typeof entry[key]!=='string'||!entry[key].trim())errors.push(`Missing ${locale} ${key}`);
  if(Object.keys(entry).some(k=>!['summary','body','seoTitle','seoDescription'].includes(k)))errors.push('Unsupported book description field');
 }
 return errors;
}
export function bookLocaleAlternates(book) {
 return Object.fromEntries(['en','fr'].filter(l=>book.descriptionLocales?.[l]).map(l=>[l,'https://abvx.xyz'+bookLocalePath(book.slug,l)]).concat(book.descriptionLocales?.en?[['x-default','https://abvx.xyz'+bookLocalePath(book.slug)]]:[]));
}
export function localizedBookDescription(book,locale='en') {
 const copy=book.descriptionLocales?.[locale];
 return copy?{...book,summary:copy.summary,description:copy.body,seoTitle:copy.seoTitle,seoDescription:copy.seoDescription}:null;
}
