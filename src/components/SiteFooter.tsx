const footerLinks = [
  { label: 'Contact', href: 'mailto:a.biletskiy@gmail.com' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/abvcreative/' },
  { label: 'GitHub', href: 'https://github.com/markoblogo' },
  { label: 'Medium', href: 'https://abvcreative.medium.com/' },
  { label: 'Substack', href: 'https://abvx.substack.com/' },
  {
    label: 'Amazon Author',
    href: 'https://www.amazon.com/stores/author/B0FTGN5QNK',
  },
];

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>
          <div className="site-footer__title">ABVX</div>
          <p>
            Working index for market infrastructure, agentic development, language systems,
            and publishing.
          </p>
          <p className="site-footer__note">Paris time / remote-friendly.</p>
        </div>
        <nav className="site-footer__links" aria-label="Footer links">
          {footerLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target={item.href.startsWith('http') ? '_blank' : undefined}
              rel={item.href.startsWith('http') ? 'noreferrer' : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
