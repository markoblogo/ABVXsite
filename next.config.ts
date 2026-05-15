import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.notion.site" },
      { protocol: "https", hostname: "**.notion.so" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.discordapp.com" },
    ],
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
