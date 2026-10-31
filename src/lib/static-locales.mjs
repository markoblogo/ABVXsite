export const staticPaths = ['/', '/about', '/work-with-me'];
export const staticLocales = ['en', 'fr', 'uk'];
export function localizedPath(path, locale) {
  return staticPaths.includes(path) && locale !== 'en' ? `/${locale}${path === '/' ? '' : path}` : path;
}
export function staticLocation(pathname) {
  for (const locale of staticLocales) for (const path of staticPaths) {
    if (pathname === localizedPath(path, locale)) return { locale, path };
  }
  return null;
}
export function staticAlternates(path) {
  return Object.fromEntries([...staticLocales.map(locale => [locale, `https://abvx.xyz${localizedPath(path, locale)}`]), ['x-default', `https://abvx.xyz${path}`]]);
}
export const staticUpdatedAt = '2026-10-31';
