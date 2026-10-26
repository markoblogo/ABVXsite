import {getLiveWritingIndex} from '@/lib/live-writing-discovery';
export const dynamic='force-dynamic';
export async function GET(){
 try{const data=await getLiveWritingIndex();return new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});}
 catch{return new Response('Writing temporarily unavailable',{status:503,headers:{'Cache-Control':'no-store'}});}
}
