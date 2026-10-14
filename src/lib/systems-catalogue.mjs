// Existing pinned items retain their order. New standalone utilities opt in
// through public content metadata, without editing the page's slug arrays.
export function systemsGroupSlugs(group, artifacts) {
  const pinned = [...group.slugs];
  if (group.title !== 'Standalone Utilities') return pinned;
  const seen = new Set(pinned);
  const additions = artifacts.filter(item => item.group === group.title && !seen.has(item.slug))
    .sort((a, b) => (a.sortRank ?? 999) - (b.sortRank ?? 999) || a.slug.localeCompare(b.slug));
  for (const item of additions) { if (!seen.has(item.slug)) { pinned.push(item.slug); seen.add(item.slug); } }
  return pinned;
}

export function isStandaloneUtilityGroup(group) {
  return group === 'Standalone Utilities' || group === 'Standalone Utilities & Experiments';
}
