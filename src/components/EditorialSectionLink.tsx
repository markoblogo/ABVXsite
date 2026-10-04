import Link from 'next/link';
import type { EditorialArticle } from '@/content/editorials';

export default function EditorialSectionLink({
  article,
}: {
  article?: Pick<EditorialArticle, 'href' | 'linkLabel'>;
}) {
  if (!article) return null;

  return (
    <Link className="editorial-section-link" href={article.href}>
      {article.linkLabel} <span aria-hidden="true">→</span>
    </Link>
  );
}
