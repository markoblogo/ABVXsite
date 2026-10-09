import youtubeSettings from '../../content/youtube.json';
import Link from 'next/link';

export type WritingSource = 'all' | 'medium' | 'substack' | 'abvx' | 'youtube';

const sourceLinks: { label: string; value: WritingSource; href: string }[] = [
  { label: 'All', value: 'all', href: '/writing' },
  { label: 'Medium', value: 'medium', href: '/writing?source=medium' },
  { label: 'Substack', value: 'substack', href: '/writing?source=substack' },
  { label: 'YouTube', value: 'youtube', href: '/writing?source=youtube' },
  { label: 'ABVX', value: 'abvx', href: '/writing?source=abvx' },
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
        <a href={youtubeSettings.channelUrl} target="_blank" rel="noopener noreferrer">
          YouTube channel -&gt;
        </a>
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
