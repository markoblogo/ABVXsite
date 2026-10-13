const RECENT_POST_COUNT = 6;
const ARCHIVE_POST_LIMIT = 30;

/** @template T @param {T[]} posts */
export function writingWindow(posts) {
  return {
    featuredPost: posts[0],
    recentPosts: posts.slice(1, RECENT_POST_COUNT + 1),
    archivePosts: posts.slice(RECENT_POST_COUNT + 1, RECENT_POST_COUNT + 1 + ARCHIVE_POST_LIMIT),
  };
}

/** @template T @param {T[]} posts */
export function visibleWritingItems(posts) {
  const {featuredPost, recentPosts, archivePosts} = writingWindow(posts);
  return posts.length ? [featuredPost, ...recentPosts, ...archivePosts] : [];
}
