import BookAudioPlayer from './BookAudioPlayer';
import {YouTubeGallery,findYouTubeVideos} from './YouTubeEmbed';
import FAQSection from './FAQSection';
import {faqPageJsonLd} from '@/lib/seo';
import type {Book} from '@/content';
import Link from 'next/link';
import DocumentLanguage from './DocumentLanguage';
import BookDetailHero from './BookDetailHero';
import BreadcrumbNav from './BreadcrumbNav';
import MarkdownContent from './MarkdownContent';
import MediaPanel from './MediaPanel';
import JsonLd from './JsonLd';
import {bookJsonLd} from '@/lib/seo';
import {bookLocalePath,localizedBookDescription} from '@/lib/book-locales.mjs';
export default function LocalizedBookPage({book,locale='en'}:{book:Book;locale?:'en'|'fr'}) {
 const copy=localizedBookDescription(book,locale) as Book;
 const fr=locale==='fr';
 const audio=book.links.find(link=>link.type==='audio');
 const videos=findYouTubeVideos(book.links);
 const editionLanguage=({en:fr?'anglais':'English',fr:fr?'français':'French',uk:fr?'ukrainien':'Ukrainian'} as Record<string,string>)[book.language||'en']||book.language;
 return <article className="detail-page detail-page--book" lang={locale}>
  <DocumentLanguage languageOverride={locale}/>
  <JsonLd id="jsonld-book-item" data={bookJsonLd(copy)}/>
  <BreadcrumbNav items={[{label:'ABVX',href:'/'},{label:fr?'Livres':'Books',href:'/books'},...(book.primarySeriesSlug?[{label:book.primarySeriesSlug==='azurbooks'?'AzurBooks':book.primarySeriesSlug,href:'/books/'+book.primarySeriesSlug}]:[]),{label:book.title}]}/>
  <nav aria-label={fr?'Langue de présentation':'Description language'} className="book-context-links">
   <Link href={bookLocalePath(book.slug)} hrefLang="en" lang="en" aria-current={!fr?'page':undefined}>English</Link>{' · '}
   <Link href={bookLocalePath(book.slug,'fr')} hrefLang="fr" lang="fr" aria-current={fr?'page':undefined}>Français</Link>
  </nav>
  <BookDetailHero book={copy} image={copy.heroImage||copy.coverImage} locale={locale}/>
  <p>{fr?`Langue du livre : ${editionLanguage}. Les liens d’achat concernent cette édition.`:`Book language: ${editionLanguage}. Purchase links are for this edition.`}</p>
  {audio?<section className="book-video-section" aria-labelledby="book-audio-title"><div className="book-video-section__header"><div className="eyebrow">{fr?'Édition audio':'Audio edition'}</div><h2 id="book-audio-title">{fr?'Écouter / Extrait':'Listen / Preview'}</h2></div><div className="book-detail-copy-panel"><BookAudioPlayer src={audio.url} title={book.title}/></div></section>:null}
  {videos.length?<section className="book-video-section" aria-labelledby="book-video-title"><div className="book-video-section__header"><div className="eyebrow">{fr?'Médias':'Media'}</div><h2 id="book-video-title">{fr?'Vidéo / Contexte':'Watch / Context'}</h2></div><YouTubeGallery links={videos} title={book.title}/></section>:null}
  <section className="book-detail-main" aria-labelledby="book-about-title"><div className="book-detail-copy-panel">
   <div className="eyebrow">ABVX Press</div><h2 id="book-about-title">{fr?'À propos du livre':'About this book'}</h2>
   <MarkdownContent>{copy.description||copy.summary}</MarkdownContent>
  </div></section>
  {book.faqs?.length?<><JsonLd id="jsonld-book-faq" data={faqPageJsonLd({id:'https://abvx.xyz/books/'+book.slug+'#faq',faqs:book.faqs})}/><FAQSection id="book-faq-title" title={fr?'Questions fréquentes':'Frequently asked questions'} faqs={book.faqs}/></>:null}
  {book.coverImage&&book.heroImage?<MediaPanel image={copy.coverImage} title={book.title} variant="project"/>:null}
 </article>;
}
