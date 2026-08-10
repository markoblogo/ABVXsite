export function formatWritingSourceLabel(source: string): string {
  if (source === 'abvx') return 'ABVX';
  if (source === 'medium') return 'Medium';
  if (source === 'substack') return 'Substack';
  return source;
}
