import Link from 'next/link';

type LegacyRouteNoticeProps = {
  eyebrow: string;
  title: string;
  description: string;
  canonicalHref: string;
  canonicalLabel: string;
};

export default function LegacyRouteNotice({
  eyebrow,
  title,
  description,
  canonicalHref,
  canonicalLabel,
}: LegacyRouteNoticeProps) {
  return (
    <div className="legacy-route-notice">
      <header className="legacy-route-notice__panel">
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
        <Link className="panel-link" href={canonicalHref}>
          Open {canonicalLabel}
        </Link>
      </header>
    </div>
  );
}
