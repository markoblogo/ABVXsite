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
      // Enforce a no-trailing-slash canonical style (except root).
      { source: "/about/", destination: "/about", permanent: true },
      { source: "/projects/", destination: "/projects", permanent: true },
      { source: "/books/", destination: "/books", permanent: true },
      { source: "/writing/", destination: "/writing", permanent: true },
      { source: "/work-with-me/", destination: "/work-with-me", permanent: true },
      { source: "/ecosystems/", destination: "/ecosystems", permanent: true },
      { source: "/books/:slug/", destination: "/books/:slug", permanent: true },
      { source: "/ecosystems/:slug/", destination: "/ecosystems/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
