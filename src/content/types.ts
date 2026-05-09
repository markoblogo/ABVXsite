export type SiteSection = 'focus' | 'systems' | 'books' | 'writing';

export type Visibility = 'public' | 'draft' | 'private';

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

export type MediaRole =
  | 'book-cover'
  | 'project-screenshot'
  | 'landing-screenshot'
  | 'mockup'
  | 'rss-image'
  | 'video-thumbnail'
  | 'generic-thumbnail';

export type ContentImage = {
  src: string;
  alt: string;
  role?: MediaRole;
  mediaRole?: MediaRole;
  width?: number;
  height?: number;
};

export type ContentLinkType =
  | 'site'
  | 'website'
  | 'github'
  | 'demo'
  | 'youtube'
  | 'amazon'
  | 'kindle'
  | 'paperback'
  | 'amazon-kindle'
  | 'amazon-paperback'
  | 'pdf'
  | 'series'
  | 'book-site'
  | 'series-site'
  | 'medium'
  | 'substack'
  | 'deck'
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
  shortTitle?: string;
  type: TType;
  primarySection: SiteSection;
  appearsIn: SiteSection[];
  status: Status;
  visibility?: Visibility;
  publishedAt?: string;
  updatedAt?: string;
  summary: string;
  description?: string;
  tags: string[];
  links: ContentLink[];
  featured: boolean;
  sortRank: number;
  needsReview: boolean;
  needsCopyReview?: boolean;
  needsMediaReview?: boolean;
  needsLinkReview?: boolean;
  editorialNotes?: string;
  mediaNeedsReview?: boolean;
};

export type Artifact = BaseContentItem<ArtifactType> & {
  thumbnail?: ContentImage;
  heroImage?: ContentImage;
  group?: string;
};

export type Book = BaseContentItem<BookType> & {
  subtitle?: string;
  displayTitle?: string;
  coverImage?: ContentImage;
  heroImage?: ContentImage;
  series?: string;
  group?: string;
  category?: string;
  formats?: string[];
};

export type Series = {
  id: string;
  slug: string;
  title: string;
  shortTitle?: string;
  type: 'series';
  primarySection: 'books';
  appearsIn: SiteSection[];
  status: Status;
  visibility?: Visibility;
  publishedAt?: string;
  updatedAt?: string;
  summary: string;
  description?: string;
  tags: string[];
  links: ContentLink[];
  featured: boolean;
  sortRank: number;
  needsReview: boolean;
  needsCopyReview?: boolean;
  needsMediaReview?: boolean;
  needsLinkReview?: boolean;
  editorialNotes?: string;
  media?: ContentImage;
  heroImage?: ContentImage;
  group?: string;
  series?: string;
  category?: string;
  formats?: string[];
};
