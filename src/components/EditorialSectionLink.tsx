import Link from 'next/link';
import { getEditorialForSection } from '@/content/editorials';

export default function EditorialSectionLink({ section }: { section: string }) {
  const article = getEditorialForSection(section);
  if (!article) return null;

  return (
    <Link className="editorial-section-link" href={article.href}>
      {article.linkLabel} <span aria-hidden="true">→</span>
    </Link>
  );
}
