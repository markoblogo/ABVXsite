// Both languages reuse the complete book renderer; only descriptive copy changes.
import BookPage,{generateMetadata as bookMetadata} from '@/app/books/[slug]/page';
type Props={params:Promise<{slug:string}>};
const french=(params:Props['params'])=>params.then(p=>({...p,descriptionLocale:'fr' as const}));
export const generateMetadata=({params}:Props)=>bookMetadata({params:french(params)});
export default function Page({params}:Props){return BookPage({params:french(params)});}
export const dynamic='force-dynamic';
