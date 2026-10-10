const kinds = new Set(['work', 'books', 'series']);
const bases = new Set(['observed', 'production', 'legacy-source', 'legacy-unknown']);
const key = item => `${item.kind}/${item.slug}`;

export function validateCatalogueDiscovery(data, now = Date.now()) {
  if (data?.version !== 1 || !Array.isArray(data.items)) return ['Invalid catalogue discovery registry'];
  const errors = [], seen = new Set();
  for (const item of data.items) {
    if (!item || !kinds.has(item.kind) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug || '') || !bases.has(item.basis)) {
      errors.push('Invalid catalogue record'); continue;
    }
    if (seen.has(key(item))) errors.push(`Duplicate catalogue record: ${key(item)}`);
    seen.add(key(item));
    const time = Date.parse(item.addedAt);
    if (item.basis === 'legacy-unknown' ? item.addedAt !== null
      : !Number.isFinite(time) || new Date(time).toISOString() !== item.addedAt || time > now) {
      errors.push(`Invalid catalogue addition time: ${key(item)}`);
    }
  }
  return errors;
}

export function registerCatalogueItems(registry, items, { now = new Date().toISOString(), bootstrap = false } = {}) {
  const errors = validateCatalogueDiscovery(registry, Date.parse(now));
  if (errors.length) throw new Error(errors.join('\n'));
  const records = new Map(registry.items.map(item => [key(item), item]));
  for (const item of items) {
    if (records.has(key(item))) continue;
    const time = Date.parse(item.publishedAt);
    const legacy = bootstrap && Number.isFinite(time) && time <= Date.parse(now);
    records.set(key(item), {
      kind: item.kind, slug: item.slug,
      addedAt: bootstrap ? legacy ? new Date(time).toISOString() : null : now,
      basis: bootstrap ? legacy ? 'legacy-source' : 'legacy-unknown' : 'observed',
    });
  }
  const result = {version:1, items:[...records.values()].sort((a,b)=>key(a).localeCompare(key(b)))};
  const resultErrors = validateCatalogueDiscovery(result, Date.parse(now));
  if (resultErrors.length) throw new Error(resultErrors.join('\n'));
  return result;
}

export function withCatalogueTimes(items, kind, registry) {
  const records = new Map(registry.items.filter(item=>item.kind===kind).map(item=>[item.slug,item.addedAt]));
  return items.map(item=>({ ...item, catalogueAddedAt: records.has(item.slug) ? records.get(item.slug) : null }));
}
