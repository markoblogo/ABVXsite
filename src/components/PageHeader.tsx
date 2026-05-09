import type { ReactNode } from 'react';

export default function PageHeader({
  eyebrow,
  title,
  summary,
  children,
}: {
  eyebrow?: string;
  title: string;
  summary?: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-header">
      {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
      <h1>{title}</h1>
      {summary ? <p>{summary}</p> : null}
      {children}
    </header>
  );
}
