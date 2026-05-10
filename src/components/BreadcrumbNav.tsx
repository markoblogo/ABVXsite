import Link from 'next/link';

type BreadcrumbNavItem = {
  label: string;
  href?: string;
};

export default function BreadcrumbNav({ items }: { items: BreadcrumbNavItem[] }) {
  if (!items.length) return null;

  return (
    <nav className="breadcrumb-nav" aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`}>
            {item.href ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
