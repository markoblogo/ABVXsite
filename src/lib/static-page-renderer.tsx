import {cloneElement} from 'react';
import Home from '@/components/static-pages/Home';
import About from '@/components/static-pages/About';
import WorkWithMe from '@/components/static-pages/WorkWithMe';
import {localizeStaticTree,type StaticLocale} from './localize-static-tree';
import {localizedPath,staticAlternates} from './static-locales.mjs';
import seo from '../../content/static-pages.json';
import {metadataWithImage,defaultOgImage,SITE_URL} from './seo';
import JsonLd from '@/components/JsonLd';
type StaticPath=keyof typeof seo;
export function staticPageMetadata(path:StaticPath,locale:StaticLocale){
 const [title,description]=seo[path][locale];
 const metadata=metadataWithImage({title,description,canonicalPath:localizedPath(path,locale),image:defaultOgImage});
 return {...metadata,alternates:{...metadata.alternates,languages:staticAlternates(path)},openGraph:{...metadata.openGraph,locale:{en:'en_US',fr:'fr_FR',uk:'uk_UA'}[locale],alternateLocale:['en','fr','uk'].filter(x=>x!==locale).map(x=>({en:'en_US',fr:'fr_FR',uk:'uk_UA'})[x]! )}};
}
export async function renderStaticPage(path:StaticPath,locale:StaticLocale){
 const element=path==='/'?await Home():path==='/about'?About():WorkWithMe();
 const [name,description]=seo[path][locale];
 const url=SITE_URL+localizedPath(path,locale);
 return <><JsonLd id="jsonld-static-localized-page" data={{'@context':'https://schema.org','@type':path==='/about'?'AboutPage':'WebPage','@id':url+'#localized-page',url,name,description,inLanguage:locale,isPartOf:{'@id':SITE_URL+'/#website'},about:{'@id':SITE_URL+'/#person'}}}/>{localizeStaticTree(cloneElement(element,{'data-static-locale':locale}),locale)}</>;
}
