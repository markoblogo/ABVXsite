// https://plausible.io/docs/excluding-localstorage
export async function excludeQaAnalytics(context,{blockAnalyticsRequests=true}={}) {
 await context.addInitScript(() => {
  try { localStorage.setItem('plausible_ignore','true'); } catch { /* Opaque origins have no storage. */ }
 });
 // Routing disables Playwright's HTTP cache; performance QA uses the flag only.
 if(!blockAnalyticsRequests)return;
 await context.route('**/*',route=>{
  const host=new URL(route.request().url()).hostname;
  return host==='plausible.io'||host.endsWith('.plausible.io')
   ? route.abort('blockedbyclient') : route.fallback();
 });
}

export async function createQaPage(browser,options={},analyticsOptions={}) {
 const context=await browser.newContext({...options,serviceWorkers:'block'});
 await excludeQaAnalytics(context,analyticsOptions);
 return context.newPage();
}
