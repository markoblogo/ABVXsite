import Link from 'next/link';

const navItems = [
  { label: 'Focus', href: '/focus' },
  { label: 'Systems', href: '/systems' },
  { label: 'Books', href: '/books' },
  { label: 'Writing', href: '/writing' },
  { label: 'About', href: '/about' },
];

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="site-brand" href="/" aria-label="ABVX home">
          <span className="site-brand__mark" aria-hidden="true">
            ABVX
          </span>
          <span className="site-brand__text">Anton Biletskyi-Volokh</span>
        </Link>
        <nav className="site-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
