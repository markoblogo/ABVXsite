import Link from 'next/link';
import { getEditorialArticle, getEditorialForSection } from '@/content/editorials';
import type { EditorialArticle } from '@/content/editorials';

export default function EditorialSectionLink({
  article,
  section,
  slug,
}: {
  article?: Pick<EditorialArticle, 'href' | 'linkLabel'> & Partial<Pick<EditorialArticle, 'language'>>;
  section?: string;
  slug?: string;
}) {
  const editorial = article ?? (section ? (slug ? getEditorialArticle(section, slug) : getEditorialForSection(section)) : undefined);
  if (!editorial) return null;
  const language = editorial.language || 'en';

  return (
    <Link className="editorial-section-link" href={editorial.href} lang={language} hrefLang={language}>
      {editorial.linkLabel} <span aria-hidden="true">→</span>
    </Link>
  );
}
