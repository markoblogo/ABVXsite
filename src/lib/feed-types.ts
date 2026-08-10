export type FeedSource = 'medium' | 'substack' | 'mn7r' | 'abvx';

export type FeedItem = {
  source: FeedSource;
  title: string;
  url: string;
  publishedAt: string;
  author?: string;
  tags?: string[];
  excerpt?: string;
  coverImage?: string;
};

export const FEED_REVALIDATE_SECONDS = 900;
export const IMAGE_FETCH_TIMEOUT_MS = 4500;

export const sourceFallbackCover: Record<FeedSource, string> = {
  medium: '/og/abvx-home.png',
  substack: '/og/abvx-home.png',
  mn7r: '/media/work/mn7r/hero.png',
  abvx: '/og/abvx-home.png',
};

export type FeedSourceConfig = {
  source: FeedSource;
  feedHosts: string[];
  articleHosts: string[];
  imageHosts: string[];
};

export const feedSourceConfigs: Record<FeedSource, FeedSourceConfig> = {
  medium: {
    source: 'medium',
    feedHosts: ['abvcreative.medium.com'],
    articleHosts: ['abvcreative.medium.com', 'medium.com'],
    imageHosts: ['cdn-images-1.medium.com', 'miro.medium.com'],
  },
  substack: {
    source: 'substack',
    feedHosts: ['abvx.substack.com'],
    articleHosts: ['abvx.substack.com'],
    imageHosts: ['substackcdn.com', '*.substackcdn.com', 'substack-post-media.s3.amazonaws.com'],
  },
  mn7r: {
    source: 'mn7r',
    feedHosts: ['mn7r.com'],
    articleHosts: ['mn7r.com'],
    imageHosts: ['mn7r.com'],
  },
  abvx: {
    source: 'abvx',
    feedHosts: [],
    articleHosts: ['abvx.xyz'],
    imageHosts: ['abvx.xyz'],
  },
};
