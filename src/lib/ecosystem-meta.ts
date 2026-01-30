import type { Book, Ecosystem, Project } from './abvx-data';

export type EcosystemMeta = {
  tagline?: string;
  labels: string[]; // Books / Site / Product / Tools
  booksCount: number;
  projectsCount: number;
};

function classifyProject(type?: string): 'tool' | 'site' | 'product' {
  const t = (type || '').toLowerCase();
  if (!t) return 'product';
  if (t.includes('tool')) return 'tool';
  if (t.includes('landing') || t.includes('site') || t.includes('book companion')) return 'site';
  return 'product';
}

export function computeEcosystemMeta(
  eco: Ecosystem,
  books: Book[],
  projects: Project[],
): EcosystemMeta {
  const booksIn = books.filter((b) => b.ecosystemIds.includes(eco.id));
  const projectsIn = projects.filter((p) => p.ecosystemIds.includes(eco.id));

  const labels = new Set<string>();
  if (booksIn.length) labels.add('Books');

  for (const p of projectsIn) {
    const kind = classifyProject(p.type);
    if (kind === 'tool') labels.add('Tools');
    if (kind === 'site') labels.add('Site');
    if (kind === 'product') labels.add('Product');
  }

  if (eco.primaryUrl) labels.add('Site');

  const tagline =
    eco.tagline ||
    ((booksIn.length || projectsIn.length)
      ? `${booksIn.length} book(s) · ${projectsIn.length} project(s)`
      : undefined);

  return {
    tagline,
    labels: Array.from(labels),
    booksCount: booksIn.length,
    projectsCount: projectsIn.length,
  };
}
