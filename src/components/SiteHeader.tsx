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
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="site-brand" href="/" aria-label="ABVX home">
          <BrandMark className="site-brand__mark" priority />
          <span className="site-brand__text">Anton Biletskyi-Volokh</span>
        </Link>
        <nav className="site-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={item.primary ? "site-nav__primary" : "site-nav__secondary"}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
