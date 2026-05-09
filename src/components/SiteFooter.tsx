import Link from 'next/link';
import {
  footerArchiveLinks,
  footerPrimaryLinks,
  socialLinks,
  type FooterLink,
  type SocialLink,
} from '@/content/navigation';

function FooterNavLink({ item }: { item: FooterLink }) {
  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer">
        {item.label}
      </a>
    );
  }

  return <Link href={item.href}>{item.label}</Link>;
}

function SocialIcon({ item }: { item: SocialLink }) {
  const isExternal = item.external && item.href.startsWith('http');

  return (
    <a
      className="site-footer__social-link"
      href={item.href}
      aria-label={item.label}
      title={item.label}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noreferrer' : undefined}
    >
      <svg
        aria-hidden="true"
        className="site-footer__social-icon"
        viewBox="0 0 40 40"
        role="img"
      >
        <rect x="0.5" y="0.5" width="39" height="39" rx="20" />
        <text x="20" y="24" textAnchor="middle">
          {item.icon}
        </text>
      </svg>
    </a>
  );
}

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <section className="site-footer__brand" aria-label="ABVX">
          <div className="site-footer__title">ABVX</div>
          <p>
            Working index for market infrastructure, agentic development, language systems,
            and publishing.
          </p>
          <p className="site-footer__note">Paris time / remote-friendly.</p>
        </section>

        <nav className="site-footer__nav" aria-label="Footer navigation">
          <div className="site-footer__link-group">
            <h2>Index</h2>
            <div className="site-footer__links">
              {footerPrimaryLinks.map((item) => (
                <FooterNavLink key={`${item.label}-${item.href}`} item={item} />
              ))}
            </div>
          </div>
          <div className="site-footer__link-group">
            <h2>Archive</h2>
            <div className="site-footer__links">
              {footerArchiveLinks.map((item) => (
                <FooterNavLink key={`${item.label}-${item.href}`} item={item} />
              ))}
            </div>
          </div>
        </nav>

        <section className="site-footer__elsewhere" aria-labelledby="footer-elsewhere-title">
          <h2 id="footer-elsewhere-title">Elsewhere</h2>
          <div className="site-footer__social-grid">
            {socialLinks.map((item) => (
              <SocialIcon key={`${item.label}-${item.href}`} item={item} />
            ))}
          </div>
        </section>
      </div>
    </footer>
  );
}
