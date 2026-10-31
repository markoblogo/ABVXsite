import {cloneElement,isValidElement,type ReactNode} from 'react';
import translations from '@/content/static-translations.json';
import {localizedPath} from './static-locales.mjs';
export type StaticLocale='en'|'fr'|'uk';
const dictionary:Record<string,{fr:string;uk:string}>=translations;
export function staticText(text:string,locale:StaticLocale){
 return locale==='en'?text:dictionary[text.replace(/\s+/g,' ').trim()]?.[locale]||text;
}
// Only the three static page templates use this adapter. lang="en" is an
// explicit boundary for catalogue/project/book/writing blocks and their links.
export function localizeStaticTree(node:ReactNode,locale:StaticLocale):ReactNode{
 if(locale==='en')return node;
 if(typeof node==='string')return staticText(node,locale);
 if(Array.isArray(node))return node.map(child=>localizeStaticTree(child,locale));
 if(!isValidElement<Record<string,unknown>>(node))return node;
 if(node.props.lang==='en')return node;
 function value(v:unknown,key:string):unknown{
  if(key==='children')return localizeStaticTree(v as ReactNode,locale);
  if(typeof v==='string'){
   if(['href','url','mainEntityOfPage','@id'].includes(key)){
    const absolute=v.startsWith('https://abvx.xyz');
    const path=absolute?v.slice('https://abvx.xyz'.length)||'/':v;
    const [base,hash]=path.split('#');
    const localized=localizedPath(base,locale);
    return (absolute?'https://abvx.xyz':'')+localized+(hash?'#'+hash:'');
   }
   return staticText(v,locale);
  }
  if(Array.isArray(v))return v.map(x=>value(x,key));
  if(v&&typeof v==='object'&&!isValidElement(v))return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,value(x,k)]));
  return v;
 }
 return cloneElement(node,Object.fromEntries(Object.entries(node.props).map(([key,v])=>[key,value(v,key)])));
}
