import Link from 'next/link';
import { getEditorialArticle, getEditorialForSection } from '@/content/editorials';

export default function EditorialSectionLink({ section, slug }: { section: string; slug?: string }) {
  const article = slug ? getEditorialArticle(section, slug) : getEditorialForSection(section);
  if (!article) return null;

  return (
    <Link className="editorial-section-link" href={article.href}>
      {article.linkLabel} <span aria-hidden="true">→</span>
    </Link>
  );
}
