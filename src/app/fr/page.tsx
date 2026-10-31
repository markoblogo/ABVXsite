import {renderStaticPage,staticPageMetadata} from '@/lib/static-page-renderer';
export const dynamic='force-dynamic';
export const metadata=staticPageMetadata('/','fr');
export default function Page(){return renderStaticPage('/','fr');}
