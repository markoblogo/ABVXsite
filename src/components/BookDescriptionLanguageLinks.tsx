import Link from 'next/link';
import {bookLocalePath} from '@/lib/book-locales.mjs';
export default function BookDescriptionLanguageLinks({slug,locale}:{slug:string;locale:'en'|'fr'}) {
 return <nav aria-label={locale==='fr'?'Langue de présentation':'Description language'} className="book-context-links">
  <Link href={bookLocalePath(slug)} hrefLang="en" lang="en" aria-current={locale==='en'?'page':undefined}>English</Link>{' · '}
  <Link href={bookLocalePath(slug,'fr')} hrefLang="fr" lang="fr" aria-current={locale==='fr'?'page':undefined}>Français</Link>
 </nav>;
}
