/** The existing JSON-frontmatter format, without CLI or filesystem dependencies. */
export function parseMarkdownSource(source, filePath) {
  if (!source.startsWith('---')) throw new Error(`${filePath}: missing frontmatter`);
  const end = source.indexOf('\n---', 3);
  if (end === -1) throw new Error(`${filePath}: unterminated frontmatter`);
  const raw = source.slice(3, end).trim();
  const body = source.slice(end + 4).replace(/^\s*\n/, '').trim();
  return { data: JSON.parse(raw), body };
}
