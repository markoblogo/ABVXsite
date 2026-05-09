import type { Artifact } from '@/content';

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
        <div className="eyebrow">Where it fits</div>
        <dl>
          <div>
            <dt>Type</dt>
            <dd>{artifact.type}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{artifact.status}</dd>
          </div>
          {artifact.group ? (
            <div>
              <dt>Group</dt>
              <dd>{artifact.group}</dd>
            </div>
          ) : null}
        </dl>
      </aside>
    </section>
  );
}
