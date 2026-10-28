import catalogueRedirects from "./src/content/catalogue-redirects.json";
import type { NextConfig } from "next";

const projectRoot = process.cwd();

const nextConfig: NextConfig = {
  // Media is served as static assets, not read by the page functions.
  // Keep it out of server traces while retaining content and the feed-cache seed.
  outputFileTracingExcludes: {
    '/*': ['./public/media/**/*'],
  },
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
  async rewrites() {
    return {beforeFiles: [
      {source: "/content-index.json", destination: "/api/writing/discovery/index"},
      {source: "/llms.txt", destination: "/api/writing/discovery/llms"},
      { source: "/good-dogs-of-the-apocalypse", destination: "/books/good-dogs-of-the-apocalypse" },
    ]};
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
      ...catalogueRedirects,
      // Preserve published audio URLs after moving identical files to Releases.
      { source: "/media/books/mn7r-agro-commodity-brokerage-en-free-edition/audiobook.mp3", destination: "https://github.com/markoblogo/mn7r-public-assets/releases/download/book-assets-2026-09-23/mn7r-agro-commodity-brokerage-en-audio.mp3", permanent: true },
      { source: "/media/books/mn7r-agro-commodity-brokerage-en-free-edition/audiobook.m4b", destination: "https://github.com/markoblogo/mn7r-public-assets/releases/download/book-assets-2026-09-23/mn7r-agro-commodity-brokerage-en-audio.m4b", permanent: true },
      // Preserve legacy URLs while moving the public IA to Focus / Systems / Books / Writing / About.
      { source: "/ecosystems", destination: "/systems", permanent: true },
      { source: "/ecosystems/", destination: "/systems", permanent: true },
      { source: "/ecosystems/:slug", destination: "/systems", permanent: true },
      { source: "/ecosystems/:slug/", destination: "/systems", permanent: true },
      { source: "/blog", destination: "/writing", permanent: true },
      { source: "/blog/", destination: "/writing", permanent: true },
      { source: "/good-dogs-of-the-apocalypse/", destination: "/good-dogs-of-the-apocalypse", permanent: true },
      // Preserve common slug aliases from media/project naming.
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
    ];
  },
};

export default nextConfig;
