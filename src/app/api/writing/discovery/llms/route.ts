import {getLiveWritingLlms} from '@/lib/live-writing-discovery';
export const dynamic='force-dynamic';
export async function GET(){
 try{const data=await getLiveWritingLlms();return new Response(data,{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});}
 catch{return new Response('Writing temporarily unavailable',{status:503,headers:{'Cache-Control':'no-store'}});}
}
