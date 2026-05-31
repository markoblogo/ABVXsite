import Link from 'next/link';

export type WritingSource = 'all' | 'medium' | 'substack';

const sourceLinks: { label: string; value: WritingSource; href: string }[] = [
  { label: 'All', value: 'all', href: '/writing' },
  { label: 'Medium', value: 'medium', href: '/writing?source=medium' },
  { label: 'Substack', value: 'substack', href: '/writing?source=substack' },
];

export default function WritingSourceLinks({ active }: { active: WritingSource }) {
  return (
    <nav className="writing-source-links" aria-label="Writing source filter">
      <div className="writing-source-links__filters">
        {sourceLinks.map((item) => (
          <Link
            key={item.value}
            href={item.href}
            aria-current={active === item.value ? 'page' : undefined}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="writing-source-links__external" aria-label="External writing archives">
        <a href="https://abvcreative.medium.com/" target="_blank" rel="noopener noreferrer">
          Medium archive -&gt;
        </a>
        <a href="https://abvx.substack.com/" target="_blank" rel="noopener noreferrer">
          Substack archive -&gt;
        </a>
      </div>
    </nav>
  );
}
