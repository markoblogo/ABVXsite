import {configuredWritingStore} from '@/content/runtime-writing-store.mjs';
import {createPublishedImageReader} from '@/content/runtime-writing-media.mjs';
const readImage=createPublishedImageReader();
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(request: Request,{params}: {params: Promise<{key:string}>}){
 const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
 if(process.env.RUNTIME_WRITING_ENABLED!=='1')return new Response(null,{status:404,headers});
 const requestedWidth=new URL(request.url).searchParams.get('w');
 if(requestedWidth!==null&&!['320','640','960','1280'].includes(requestedWidth))return new Response(null,{status:400,headers});
 try{const image=await readImage(configuredWritingStore(),(await params).key,requestedWidth===null?undefined:Number(requestedWidth));
  if(!image)return new Response(null,{status:404,headers});
  return new Response(new Uint8Array(image.bytes),{headers:{...headers,'Content-Type':image.contentType}});
 }catch{return new Response(null,{status:503,headers});}
}
