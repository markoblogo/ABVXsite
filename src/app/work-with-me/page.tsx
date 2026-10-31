import {renderStaticPage,staticPageMetadata} from '@/lib/static-page-renderer';
export const dynamic='force-dynamic';
export const metadata=staticPageMetadata('/work-with-me','en');
export default function Page(){return renderStaticPage('/work-with-me','en');}
