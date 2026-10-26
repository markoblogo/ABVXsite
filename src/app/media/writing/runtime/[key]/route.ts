import {configuredWritingStore} from '@/content/runtime-writing-store.mjs';
import {publishedImage} from '@/content/runtime-writing-media.mjs';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(_request: Request,{params}: {params: Promise<{key:string}>}){
 const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
 if(process.env.RUNTIME_WRITING_ENABLED!=='1')return new Response(null,{status:404,headers});
 try{const image=await publishedImage(configuredWritingStore(),(await params).key);
  if(!image)return new Response(null,{status:404,headers});
  return new Response(new Uint8Array(image.bytes),{headers:{...headers,'Content-Type':image.contentType}});
 }catch{return new Response(null,{status:503,headers});}
}
