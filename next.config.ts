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
      { source: "/projects", destination: "/systems", permanent: true },
      { source: "/projects/", destination: "/systems", permanent: true },
      { source: "/ecosystems", destination: "/systems", permanent: true },
      { source: "/ecosystems/", destination: "/systems", permanent: true },
      { source: "/ecosystems/:slug", destination: "/systems", permanent: true },
      { source: "/ecosystems/:slug/", destination: "/systems", permanent: true },
      { source: "/cropto", destination: "/focus", permanent: true },
      { source: "/cropto/", destination: "/focus", permanent: true },
      { source: "/toki-pona", destination: "/books", permanent: true },
      { source: "/toki-pona/", destination: "/books", permanent: true },
      { source: "/llmo", destination: "/systems", permanent: true },
      { source: "/llmo/", destination: "/systems", permanent: true },
      { source: "/blog", destination: "/writing", permanent: true },
      { source: "/blog/", destination: "/writing", permanent: true },
      { source: "/links", destination: "/about", permanent: true },
      { source: "/links/", destination: "/about", permanent: true },
      { source: "/work-with-me", destination: "/about", permanent: true },
      { source: "/work-with-me/", destination: "/about", permanent: true },
      { source: "/abvx-press", destination: "/books", permanent: true },
      { source: "/abvx-press/", destination: "/books", permanent: true },
      { source: "/tech-lab", destination: "/systems", permanent: true },
      { source: "/tech-lab/", destination: "/systems", permanent: true },
      { source: "/lang-lab", destination: "/systems", permanent: true },
      { source: "/lang-lab/", destination: "/systems", permanent: true },
      // Enforce a no-trailing-slash canonical style (except root).
      { source: "/about/", destination: "/about", permanent: true },
      { source: "/books/", destination: "/books", permanent: true },
      { source: "/writing/", destination: "/writing", permanent: true },
      { source: "/focus/", destination: "/focus", permanent: true },
      { source: "/systems/", destination: "/systems", permanent: true },
      { source: "/books/:slug/", destination: "/books/:slug", permanent: true },
      { source: "/work/:slug/", destination: "/work/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
