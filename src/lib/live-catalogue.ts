import {cache} from 'react';
import {createContentAccess} from '@/content';
import {bookFromSource,workFromSource,seriesFromSource,readNativeWritingFiles} from '@/content/file-loader';
import {getLiveWritingState} from './live-writing';
import {groupCatalogueSources} from './catalogue-source-groups.mjs';
import {readLegacyCatalogueSources,mergeCatalogueSources,catalogueConfiguration} from '@/content/runtime-catalogue.mjs';
import chronology from '../../content/catalogue-discovery.json';
export const getLiveCatalogue = cache(async()=>{
 const state=await getLiveWritingState();
 const sources=state?mergeCatalogueSources(state,readLegacyCatalogueSources()):readLegacyCatalogueSources();
 const {visible,records,families}=groupCatalogueSources(sources);
 const times={...chronology,items:[...chronology.items]};
 if(state)for(const {data:d,family:kind} of records){const r=state.records[d.slug];if(r&&r.firstAddedAt){times.items=times.items.filter(x=>!(x.slug===d.slug&&x.kind===kind));times.items.push({kind:kind!,slug:d.slug,addedAt:r.firstAddedAt,basis:'observed'});}}
 return {...createContentAccess({readBookFiles:()=>families.books.map(bookFromSource),readWorkFiles:()=>families.work.map(workFromSource),readSeriesFiles:()=>families.series.map(seriesFromSource),readNativeWritingFiles},times),...catalogueConfiguration(visible,Object.keys(state?.records||{}))};
});
