import {notFound} from 'next/navigation';
import {getLiveCatalogue} from '@/lib/live-catalogue';
import LocalizedBookPage from '@/components/LocalizedBookPage';
import {bookLocaleAlternates,bookLocalePath,localizedBookDescription} from '@/lib/book-locales.mjs';
import {metadataWithImage,imageMetadata,booksOgImage} from '@/lib/seo';
import type {Metadata} from 'next';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata> {
 const {slug}=await params;const {getBookBySlug}=await getLiveCatalogue();const book=getBookBySlug(slug);if(!book?.descriptionLocales?.fr)notFound();
 const copy=localizedBookDescription(book,'fr');
 const metadata=metadataWithImage({title:copy.seoTitle,description:copy.seoDescription,canonicalPath:bookLocalePath(slug,'fr'),image:imageMetadata(book.heroImage||book.coverImage,booksOgImage,'book'),type:'book'});
 return {...metadata,alternates:{canonical:'https://abvx.xyz'+bookLocalePath(slug,'fr'),languages:bookLocaleAlternates(book)}};
}
export default async function Page({params}:{params:Promise<{slug:string}>}) {
 const {slug}=await params;const {getBookBySlug}=await getLiveCatalogue();const book=getBookBySlug(slug);if(!book?.descriptionLocales?.fr)notFound();
 return <LocalizedBookPage book={book} locale="fr"/>;
}
