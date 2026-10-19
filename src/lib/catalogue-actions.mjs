const purchase=['kindle','amazon-kindle','paperback','amazon-paperback','amazon'];
const downloads=['pdf','epub','audio','audiobook'];
const projectActions=['site','website','demo','blog','book-site','series-site','series','deck',...downloads];
const supporting=['site','website','book-site','series','series-site','demo','github','youtube','deck','medium','substack','other'];
/** @template {{type:string,label:string,url:string}} T @param {readonly T[]} links @param {'book'|'work'} kind @param {number|undefined} limit */
export function groupCatalogueActions(links,kind='work',limit=undefined){
 const main=new Set(kind==='book'?[...purchase,...downloads]:projectActions);
 if(kind==='work'&&!links.some(link=>main.has(link.type)))main.add('github');
 const order=kind==='book'?[...purchase,...downloads,...supporting]:[...projectActions,'github','youtube',...purchase,...supporting];
 const rank=type=>{const index=order.indexOf(type);return index<0?999:index;};
 const sorted=[...links].sort((a,b)=>Number(main.has(b.type))-Number(main.has(a.type))||rank(a.type)-rank(b.type)||a.label.localeCompare(b.label));
 const visible=typeof limit==='number'?sorted.slice(0,limit):sorted;
 return {primary:visible.filter(link=>main.has(link.type)),secondary:visible.filter(link=>!main.has(link.type))};
}
