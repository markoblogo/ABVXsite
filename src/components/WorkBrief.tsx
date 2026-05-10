import type { Artifact } from '@/content';
import { operationalLinks } from '@/content/link-utils';

function uniqueTexts(texts: string[]): string[] {
  const seen = new Set<string>();
  return texts.filter((text) => {
    const key = text.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function WorkBrief({ artifact }: { artifact: Artifact }) {
  const texts = uniqueTexts([artifact.description || '', artifact.summary]);
  const publicSections = uniqueTexts([artifact.primarySection, ...artifact.appearsIn]);
  const links = operationalLinks(artifact.links);
  const siteLink = links.find((link) => link.type === 'site' || link.type === 'demo');
  const githubLink = links.find((link) => link.type === 'github');

  return (
    <section className="work-brief" aria-labelledby="work-brief-title">
      <div className="work-brief__main">
        <div className="eyebrow">Project brief</div>
        <h2 id="work-brief-title">What it is</h2>
        {texts.map((text) => (
          <p key={text}>{text}</p>
        ))}
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
