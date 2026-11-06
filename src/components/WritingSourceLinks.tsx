import youtubeSettings from '../../content/youtube.json';
import Link from 'next/link';
import { writingTopics } from '@/content/writing-topics.mjs';
import { writingSearchHref } from '@/lib/writing-search.mjs';

export type WritingSource = 'all' | 'medium' | 'substack' | 'abvx' | 'youtube';

const sourceLinks: { label: string; value: WritingSource; href: string }[] = [
  { label: 'All', value: 'all', href: '/writing' },
  { label: 'Medium', value: 'medium', href: '/writing?source=medium' },
  { label: 'Substack', value: 'substack', href: '/writing?source=substack' },
  { label: 'YouTube', value: 'youtube', href: '/writing?source=youtube' },
  { label: 'ABVX', value: 'abvx', href: '/writing?source=abvx' },
];

export default function WritingSourceLinks({ active, query = '', topic = '' }: { active: WritingSource; query?: string; topic?: string }) {
  return (
    <nav className="writing-source-links" aria-label="Writing source filter">
      <div className="writing-source-links__filters">
        {sourceLinks.map((item) => (
          <Link
            key={item.value}
            href={writingSearchHref(item.value, query)}
            aria-current={active === item.value ? 'page' : undefined}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <form action="/writing" method="get" role="search" aria-label="Search Writing" className="writing-search">
        {active !== 'all' ? <input type="hidden" name="source" value={active} /> : null}
        {active === 'abvx' && topic ? <input type="hidden" name="topic" value={topic} /> : null}
        <label htmlFor="writing-query">Search</label>
        <input id="writing-query" name="q" type="search" defaultValue={query} key={query}
          placeholder="Writing keywords…" maxLength={200} enterKeyHint="search"
          autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
        <button type="submit" aria-label="Search Writing"><span aria-hidden="true">→</span></button>
      </form>
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
      {active === 'abvx' ? (
        <div className="writing-source-links__filters writing-topic-links" role="group" aria-label="ABVX topic filter">
          {[{ slug: '', label: 'All topics' }, ...writingTopics].map(item => (
            <Link key={item.slug} href={writingSearchHref('abvx', query, item.slug)} scroll={false}
              aria-current={topic === item.slug ? 'page' : undefined}>{item.label}</Link>
          ))}
        </div>
      ) : null}
    </nav>
  );
}
