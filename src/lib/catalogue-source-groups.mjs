import {parseMarkdownSource} from '../content/markdown-source.mjs';
import {catalogueFamily} from '../content/runtime-catalogue.mjs';

// One request-local projection, never a persistent cache of withdrawn content.
export function groupCatalogueSources(sources) {
 const visible=[],records=[],families={books:[],work:[],series:[],sections:[]};
 for(const source of sources){
  const {data}=parseMarkdownSource(source);
  if(['private','draft'].includes(data.visibility))continue;
  visible.push(source);
  const family=catalogueFamily(data);
  records.push({data,family});
  if(family)families[family].push(source);
 }
 return {visible,records,families};
}
