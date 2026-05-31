import type { NextConfig } from "next";

const projectRoot = process.cwd();

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.notion.site" },
      { protocol: "https", hostname: "**.notion.so" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.discordapp.com" },
      { protocol: "https", hostname: "cdn-images-1.medium.com" },
      { protocol: "https", hostname: "miro.medium.com" },
      { protocol: "https", hostname: "substackcdn.com" },
      { protocol: "https", hostname: "**.substackcdn.com" },
      { protocol: "https", hostname: "mn7r.com" },
    ],
  },
  async headers() {
    const securityHeaders = [
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      {
        key: "Permissions-Policy",
        value: [
          "accelerometer=()",
          "camera=()",
          "geolocation=()",
          "gyroscope=()",
          "magnetometer=()",
          "microphone=()",
          "payment=()",
          "usb=()",
        ].join(", "),
      },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Origin-Agent-Cluster", value: "?1" },
    ];

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      // Preserve legacy URLs while moving the public IA to Focus / Systems / Books / Writing / About.
      { source: "/ecosystems", destination: "/systems", permanent: true },
      { source: "/ecosystems/", destination: "/systems", permanent: true },
      { source: "/ecosystems/:slug", destination: "/systems", permanent: true },
      { source: "/ecosystems/:slug/", destination: "/systems", permanent: true },
      { source: "/blog", destination: "/writing", permanent: true },
      { source: "/blog/", destination: "/writing", permanent: true },
      // Preserve common slug aliases from media/project naming.
      { source: "/work/agentsmd-generator", destination: "/work/agents-md-generator", permanent: true },
      { source: "/work/agentsmd-generator/", destination: "/work/agents-md-generator", permanent: true },
      { source: "/work/asciitheme", destination: "/work/ascii-theme", permanent: true },
      { source: "/work/asciitheme/", destination: "/work/ascii-theme", permanent: true },
      { source: "/books/future-proof-your-productivity", destination: "/books/future-proof-productivity", permanent: true },
      { source: "/books/future-proof-your-productivity/", destination: "/books/future-proof-productivity", permanent: true },
      { source: "/books/dao-de-jing", destination: "/books/dao-de-jing-toki-pona", permanent: true },
      { source: "/books/dao-de-jing/", destination: "/books/dao-de-jing-toki-pona", permanent: true },
      { source: "/books/ukrainian-modernism-series", destination: "/books/modernisme-ukrainien", permanent: true },
      { source: "/books/ukrainian-modernism-series/", destination: "/books/modernisme-ukrainien", permanent: true },
      { source: "/books/toki-pona-classics-series", destination: "/books/toki-pona-free-kits", permanent: true },
      { source: "/books/toki-pona-classics-series/", destination: "/books/toki-pona-free-kits", permanent: true },
      // Enforce a no-trailing-slash canonical style (except root).
      { source: "/about/", destination: "/about", permanent: true },
      { source: "/books/", destination: "/books", permanent: true },
      { source: "/writing/", destination: "/writing", permanent: true },
      { source: "/focus/", destination: "/focus", permanent: true },
      { source: "/systems/", destination: "/systems", permanent: true },
      { source: "/cropto/", destination: "/cropto", permanent: true },
      { source: "/tech-lab/", destination: "/tech-lab", permanent: true },
      { source: "/lang-lab/", destination: "/lang-lab", permanent: true },
      { source: "/projects/", destination: "/projects", permanent: true },
      { source: "/abvx-press/", destination: "/abvx-press", permanent: true },
      { source: "/links/", destination: "/links", permanent: true },
      { source: "/llmo/", destination: "/llmo", permanent: true },
      { source: "/work-with-me/", destination: "/work-with-me", permanent: true },
      { source: "/toki-pona/", destination: "/toki-pona", permanent: true },
      { source: "/books/:slug/", destination: "/books/:slug", permanent: true },
      { source: "/work/:slug/", destination: "/work/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
