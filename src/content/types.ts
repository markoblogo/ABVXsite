export type SiteSection = 'focus' | 'systems' | 'books' | 'writing';

export type ArtifactType =
  | 'market-infrastructure'
  | 'web-service'
  | 'tool'
  | 'protocol'
  | 'ai-workflow'
  | 'language-experiment'
  | 'book-companion'
  | 'research'
  | 'build-log';

export type BookType =
  | 'book'
  | 'series'
  | 'translation'
  | 'free-edition'
  | 'companion';

export type Status = 'live' | 'released' | 'building' | 'research' | 'archive';

export type ContentImage = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

export type ContentLinkType =
  | 'website'
  | 'github'
  | 'demo'
  | 'youtube'
  | 'amazon'
  | 'amazon-kindle'
  | 'amazon-paperback'
  | 'pdf'
  | 'book-site'
  | 'series-site'
  | 'medium'
  | 'substack'
  | 'other';

export type ContentLink = {
  type: ContentLinkType;
  label: string;
  url: string;
};

type BaseContentItem<TType extends string> = {
  id: string;
  slug: string;
  title: string;
  type: TType;
  primarySection: SiteSection;
  appearsIn: SiteSection[];
  status: Status;
  publishedAt?: string;
  updatedAt?: string;
  summary: string;
  description?: string;
  tags: string[];
  links: ContentLink[];
  featured: boolean;
  sortRank: number;
  needsReview: boolean;
  mediaNeedsReview?: boolean;
};

export type Artifact = BaseContentItem<ArtifactType> & {
  thumbnail?: ContentImage;
  heroImage?: ContentImage;
  group?: string;
};

export type Book = BaseContentItem<BookType> & {
  coverImage?: ContentImage;
  heroImage?: ContentImage;
  series?: string;
  category?: string;
  formats?: string[];
};
