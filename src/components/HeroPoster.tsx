import type { ReactNode } from 'react';

export default function HeroPoster({
  eyebrow,
  title,
  summary,
  children,
}: {
  eyebrow?: string;
  title: string;
  summary: string;
  children?: ReactNode;
}) {
  return (
    <section className="hero-poster">
      <div className="hero-poster__motif" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="hero-poster__copy">
        {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
        <h1>{title}</h1>
        <p>{summary}</p>
        {children}
      </div>
    </section>
  );
}
