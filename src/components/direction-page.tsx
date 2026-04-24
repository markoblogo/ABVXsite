import type { Book, Project } from '@/lib/abvx-data';
import {
  type Direction,
  type DirectionItem,
  directionCluster,
  directionSubcluster,
  itemBelongsToDirection,
} from '@/lib/directions';
import ZoomableImage from '@/components/zoomable-image';

const card =
  'rounded-xl border border-black/10 bg-black/5 p-5 hover:border-black/20 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20';

const chip =
  'inline-flex items-center rounded-full border border-black/10 px-2 py-0.5 text-xs text-zinc-600 dark:border-white/10 dark:text-zinc-300';

function itemUrl(item: DirectionItem): string | undefined {
  if (item.kind === 'project') return item.website || item.github || item.demo;
  return item.site || item.amazon || item.paper || item.pdf;
}

function itemLinks(item: DirectionItem) {
  if (item.kind === 'project') {
    return [
      ['Website', item.website],
      ['GitHub', item.github],
      ['Demo', item.demo],
    ] as const;
  }

  return [
    ['Site', item.site],
    ['Amazon', item.amazon],
    ['Paper', item.paper],
    ['PDF', item.pdf],
  ] as const;
}

function DirectionCard({
  item,
  direction,
}: {
  item: DirectionItem;
  direction: Direction;
}) {
  const subcluster = directionSubcluster(item, direction);
  const url = itemUrl(item);
  const links = itemLinks(item).filter(([, href]) => Boolean(href));

  const body = (
    <div className="flex flex-col gap-4 sm:flex-row">
      {item.coverImage ? (
        <ZoomableImage
          src={item.coverImage}
          alt=""
          width={144}
          height={104}
          imgClassName="h-28 w-36 flex-none rounded-xl border border-black/10 object-cover dark:border-white/10"
        />
      ) : (
        <div className="h-28 w-36 flex-none rounded-xl border border-black/10 bg-white/40 dark:border-white/10 dark:bg-white/5" />
      )}

      <div className="min-w-0 flex-1">
        <div className="text-base font-semibold leading-snug break-words">{item.name}</div>
        {item.kind === 'project' && item.tagline ? (
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300 break-words">
            {item.tagline}
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          <span className={chip}>{item.kind === 'book' ? 'Book' : 'Project'}</span>
          {item.assetType ? <span className={chip}>{item.assetType}</span> : null}
          {subcluster ? <span className={chip}>{subcluster}</span> : null}
          {item.initiative ? <span className={chip}>{item.initiative}</span> : null}
        </div>

        {links.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {links.map(([label, href]) => (
              <a
                key={label}
                className="inline-flex items-center rounded-full border border-black/15 bg-black/5 px-2.5 py-1 text-xs font-semibold text-zinc-800 hover:bg-black/10 dark:border-white/15 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
                href={href}
                target="_blank"
                rel="noreferrer"
              >
                {label}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );

  if (!url) return <div className={card}>{body}</div>;

  return (
    <a className={card} href={url} target="_blank" rel="noreferrer">
      {body}
    </a>
  );
}

export default function DirectionPage({
  direction,
  projects,
  books,
}: {
  direction: Direction;
  projects: Project[];
  books: Book[];
}) {
  const items: DirectionItem[] = [
    ...projects.map((project) => ({ ...project, kind: 'project' as const })),
    ...books.map((book) => ({ ...book, kind: 'book' as const })),
  ]
    .filter((item) => itemBelongsToDirection(item, direction))
    .sort((a, b) => {
      const clusterCompare = directionCluster(a, direction).localeCompare(
        directionCluster(b, direction),
      );
      if (clusterCompare) return clusterCompare;
      return a.name.localeCompare(b.name);
    });

  const grouped = items.reduce<Record<string, DirectionItem[]>>((acc, item) => {
    const cluster = directionCluster(item, direction);
    acc[cluster] ||= [];
    acc[cluster].push(item);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-8">
      <header className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight">{direction.title}</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          {direction.tagline}
        </p>
      </header>

      <div className="grid gap-5">
        {Object.entries(grouped).map(([cluster, clusterItems]) => (
          <section key={cluster} className="flex flex-col gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">{cluster}</h2>
              <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {clusterItems.length} item{clusterItems.length === 1 ? '' : 's'}
              </div>
            </div>
            <div className="grid gap-3">
              {clusterItems.map((item) => (
                <DirectionCard key={`${item.kind}-${item.id}`} item={item} direction={direction} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
