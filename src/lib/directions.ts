import type { Book, Project } from '@/lib/abvx-data';

export type DirectionName = 'ABVX Press' | 'Cropto' | 'Tech Lab' | 'Lang Lab';

export type Direction = {
  name: DirectionName;
  slug: string;
  href: string;
  title: string;
  tagline: string;
};

export type DirectionItem =
  | (Project & { kind: 'project' })
  | (Book & { kind: 'book' });

export const DIRECTIONS: Direction[] = [
  {
    name: 'Cropto',
    slug: 'cropto',
    href: '/cropto',
    title: 'Cropto',
    tagline: 'Commodity trading infrastructure: services, dashboards, monitors, and productized market tools.',
  },
  {
    name: 'ABVX Press',
    slug: 'abvx-press',
    href: '/abvx-press',
    title: 'ABVX Press',
    tagline: 'Books, translation series, companion landings, free editions, and publishing experiments.',
  },
  {
    name: 'Tech Lab',
    slug: 'tech-lab',
    href: '/tech-lab',
    title: 'Tech Lab',
    tagline: 'AI-development tooling, open-source utilities, landing systems, services, and shipped experiments.',
  },
  {
    name: 'Lang Lab',
    slug: 'lang-lab',
    href: '/lang-lab',
    title: 'Lang Lab',
    tagline: 'Language systems, Toki Pona work, pictographic protocols, translators, and language-AI experiments.',
  },
];

export function getDirectionBySlug(slug: string): Direction | undefined {
  return DIRECTIONS.find((direction) => direction.slug === slug);
}

export function itemBelongsToDirection(item: DirectionItem, direction: Direction): boolean {
  return (
    item.primaryDirection === direction.name ||
    item.relatedDirections.includes(direction.name)
  );
}

export function directionCluster(item: DirectionItem, direction: Direction): string {
  if (direction.name === 'ABVX Press') return item.pressCluster || 'General';
  if (direction.name === 'Cropto') return item.croptoCluster || 'General';
  if (direction.name === 'Tech Lab') return item.techCluster || 'General';
  return item.langCluster || 'General';
}

export function directionSubcluster(item: DirectionItem, direction: Direction): string | undefined {
  if (direction.name === 'ABVX Press') return item.pressSubcluster;
  if (direction.name === 'Cropto') return item.croptoSubcluster;
  if (direction.name === 'Tech Lab') return item.techSubcluster;
  return item.langSubcluster;
}
