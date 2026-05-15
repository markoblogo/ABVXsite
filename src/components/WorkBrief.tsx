import type { Artifact } from '@/content';
import { operationalLinks } from '@/content/link-utils';
import Link from 'next/link';
import MarkdownContent from './MarkdownContent';

function uniqueTexts(texts: string[]): string[] {
  const seen = new Set<string>();
  return texts.filter((text) => {
    const key = text.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const focusInfrastructureGroups = new Set([
  'Trading & Brokerage Platforms',
  'Market Intelligence, Monitoring & Indexes',
  'Market Fronts & Partner Landings',
]);

function sectionLabel(section: string): string {
  const labels: Record<string, string> = {
    focus: 'Current Focus',
    systems: 'Systems Catalogue',
    books: 'ABVX Press',
    writing: 'Writing',
  };
  return labels[section] || section;
}

function sectionHref(section: string): string {
  return `/${section}`;
}

export default function WorkBrief({ artifact }: { artifact: Artifact }) {
  const body = artifact.description || artifact.summary;
  const publicSections = uniqueTexts([artifact.primarySection, ...artifact.appearsIn]);
  const links = operationalLinks(artifact.links);
  const siteLink = links.find((link) => link.type === 'site' || link.type === 'demo');
  const githubLink = links.find((link) => link.type === 'github');
  const partOfLinks = [
    ...publicSections.map((section) => ({ label: sectionLabel(section), href: sectionHref(section) })),
    ...(artifact.group && focusInfrastructureGroups.has(artifact.group)
      ? [{ label: 'Agro Market Infrastructure Systems', href: '/systems' }]
      : []),
  ];

  return (
    <section className="work-brief" aria-labelledby="work-brief-title">
      <div className="work-brief__main">
        <div className="eyebrow">Project brief</div>
        <h2 id="work-brief-title">What it is</h2>
        <MarkdownContent>{body}</MarkdownContent>
      </div>
      <aside className="work-brief__context" aria-label="Project context">
        <div className="eyebrow">Key facts</div>
        <dl>
          <div>
            <dt>Type</dt>
            <dd>{artifact.type}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{artifact.status}</dd>
          </div>
          <div>
            <dt>Section</dt>
            <dd>{publicSections.join(', ')}</dd>
          </div>
          {partOfLinks.length ? (
            <div>
              <dt>Part of</dt>
              <dd>
                {partOfLinks.map((link, index) => (
                  <span key={`${link.href}-${link.label}`}>
                    {index > 0 ? ', ' : null}
                    <Link href={link.href}>{link.label}</Link>
                  </span>
                ))}
              </dd>
            </div>
          ) : null}
          {artifact.group ? (
            <div>
              <dt>Related ecosystem</dt>
              <dd>{artifact.group}</dd>
            </div>
          ) : null}
          {siteLink ? (
            <div>
              <dt>Canonical site</dt>
              <dd>
                <a href={siteLink.url} target="_blank" rel="noreferrer">
                  {siteLink.label || 'Site'}
                </a>
              </dd>
            </div>
          ) : null}
          {githubLink ? (
            <div>
              <dt>GitHub</dt>
              <dd>
                <a href={githubLink.url} target="_blank" rel="noreferrer">
                  {githubLink.label || 'GitHub'}
                </a>
              </dd>
            </div>
          ) : null}
        </dl>
      </aside>
    </section>
  );
}
