import { readFileSync } from 'node:fs';
import path from 'node:path';
import editorialConfig from '../../content/editorial/index.json';

type EditorialConfigEntry = (typeof editorialConfig)[number] & { language?: string; translationGroup?: string };

export type EditorialArticle = EditorialConfigEntry & { body: string; href: string };

const editorialDirectory = path.join(process.cwd(), 'content/editorial');
let editorialArticlesCache: EditorialArticle[] | undefined;

export function getEditorialArticles(): EditorialArticle[] {
  if (editorialArticlesCache) return editorialArticlesCache;

  editorialArticlesCache = (editorialConfig as EditorialConfigEntry[]).map((article) => {
    const markdown = readFileSync(path.join(editorialDirectory, article.source), 'utf8').replace(/\r\n/g, '\n');
    const [titleLine, ...bodyLines] = markdown.trim().split('\n');
    const sourceTitle = titleLine.match(/^#\s+\*\*(.+?)\*\*\s*$/)?.[1] ?? titleLine.replace(/^#\s+/, '');

    if (sourceTitle !== article.title) {
      throw new Error(`Editorial title mismatch in ${article.source}: ${sourceTitle}`);
    }

    return {
      ...article,
      body: bodyLines.join('\n').trim(),
      href: `/editorial/${article.section}/${article.slug}`,
    };
  });
  return editorialArticlesCache;
}

export function getEditorialArticle(section: string, slug: string): EditorialArticle | undefined {
  return getEditorialArticles().find((article) => article.section === section && article.slug === slug);
}

export function getEditorialForSection(section: string): EditorialArticle | undefined {
  return getEditorialArticles().find((article) => article.section === section);
}
