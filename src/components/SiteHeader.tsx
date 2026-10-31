'use client';
import {usePathname} from 'next/navigation';
import {staticLocation,localizedPath,staticLocales} from '@/lib/static-locales.mjs';
import Link from 'next/link';
import BrandMark from './BrandMark';

const navItems = [
  { label: 'Projects', href: '/systems', primary: true },
  { label: 'Experience', href: '/about', primary: true },
  { label: 'Work with me', href: '/work-with-me', primary: true },
  { label: 'Focus', href: '/focus', primary: false },
  { label: 'Books', href: '/books', primary: false },
  { label: 'Writing', href: '/writing', primary: false },
];

export default function SiteHeader() {
  const location=staticLocation(usePathname());
  const locale=location?.locale||'en';
  const labels=locale==='fr'?{Experience:'Expérience','Work with me':'Travaillons ensemble'}:locale==='uk'?{Experience:'Досвід','Work with me':'Співпраця зі мною'}:{};
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <div className="site-header__identity">
        <Link className="site-brand" href={localizedPath('/',locale)} aria-label="ABVX home">
          <BrandMark className="site-brand__mark" priority />
          <span className="site-brand__text">Anton Biletskyi-Volokh</span>
        </Link>
        {location ? <div className="site-languages" role="navigation" aria-label="Language / Langue / Мова">{staticLocales.map(language=><Link key={language} href={localizedPath(location.path,language)} hrefLang={language} lang={language} aria-label={{en:'English',fr:'Français',uk:'Українська'}[language]} aria-current={locale===language?'page':undefined}>{language.toUpperCase()}</Link>)}</div> : null}
        </div>
        <nav className="site-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link key={item.href} href={localizedPath(item.href,locale)} className={item.primary ? "site-nav__primary" : "site-nav__secondary"}>
              {labels[item.label as keyof typeof labels]||item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
