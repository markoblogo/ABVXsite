import type { ReactNode } from 'react';

export default function SectionPanel({
  title,
  eyebrow,
  children,
  accent = false,
}: {
  title?: string;
  eyebrow?: string;
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <section className={`section-panel${accent ? ' section-panel--accent' : ''}`}>
      {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
      {title ? <h2>{title}</h2> : null}
      {children}
    </section>
  );
}
