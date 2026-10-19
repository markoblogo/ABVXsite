// https://plausible.io/docs/excluding-localstorage
export async function excludeQaAnalytics(context) {
 await context.addInitScript(() => {
  try { localStorage.setItem('plausible_ignore','true'); } catch { /* Opaque origins have no storage. */ }
 });
 await context.route('**/*',route=>{
  const host=new URL(route.request().url()).hostname;
  return host==='plausible.io'||host.endsWith('.plausible.io')
   ? route.abort('blockedbyclient') : route.fallback();
 });
}

export async function createQaPage(browser,options={}) {
 const context=await browser.newContext({...options,serviceWorkers:'block'});
 await excludeQaAnalytics(context);
 return context.newPage();
}
