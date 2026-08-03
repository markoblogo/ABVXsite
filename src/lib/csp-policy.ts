const imageSources = [
  "'self'",
  "data:",
  "blob:",
  "https://cdn-images-1.medium.com",
  "https://miro.medium.com",
  "https://substackcdn.com",
  "https://*.substackcdn.com",
  "https://substack-post-media.s3.amazonaws.com",
  "https://mn7r.com",
  "https://images.unsplash.com",
  "https://cdn.discordapp.com",
  "https://*.notion.site",
  "https://*.notion.so",
  "https://*.amazonaws.com",
].join(" ");

const plausibleDomains = "https://plausible.io https://*.plausible.io";

function compactCsp(value: string): string {
  return value.replace(/\s{2,}/g, " ").trim();
}

export function generateNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}

export function buildContentSecurityPolicy(nonce: string, options: { reportOnly?: boolean } = {}): string {
  const isDev = process.env.NODE_ENV === "development";
  const scriptPolicy = `'self' 'nonce-${nonce}' 'strict-dynamic' ${plausibleDomains}${isDev ? " 'unsafe-eval'" : ""}`;
  const stylePolicy = options.reportOnly ? `'self' 'nonce-${nonce}'` : "'self' 'unsafe-inline'";

  return [
    "default-src 'self'",
    `script-src ${scriptPolicy}`,
    `script-src-elem ${scriptPolicy}`,
    "script-src-attr 'none'",
    `style-src ${stylePolicy}`,
    ...(options.reportOnly ? ["style-src-attr 'none'"] : []),
    `img-src ${imageSources}`,
    "font-src 'self' data:",
    `connect-src 'self' ${plausibleDomains}`,
    "media-src 'self'",
    "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
    ...(options.reportOnly ? ["report-uri /api/csp-report", "report-to csp-endpoint"] : []),
  ].map(compactCsp).join("; ");
}
