const channelIdPattern = /^UC[\w-]{22}$/;
const videoIdPattern = /^[\w-]{11}$/;

function validTimestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value)) return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value.replace('Z', '.000Z');
}

function youtubeUrl(value) {
  if (typeof value !== 'string' || value !== value.trim()) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'www.youtube.com' && !url.username && !url.password && !url.port && !url.hash ? url : null;
  } catch { return null; }
}

export function validateYoutubeSettings(settings) {
  const errors = [];
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return ['settings must be an object'];
  for (const field of ['title', 'summary']) {
    if (typeof settings[field] !== 'string' || !settings[field].trim()) errors.push(`${field} must be a non-empty string`);
  }
  if (typeof settings.channelId !== 'string' || !channelIdPattern.test(settings.channelId)) errors.push('channelId must be a YouTube channel ID');
  if (!validTimestamp(settings.publishedAfter)) errors.push('publishedAfter must be a valid UTC timestamp (YYYY-MM-DDTHH:mm:ssZ)');
  const channel = youtubeUrl(settings.channelUrl);
  if (!channel || channel.search || !(/^\/@[\w.-]+$/.test(channel.pathname) || channel.pathname === `/channel/${settings.channelId}`)) errors.push('channelUrl must be a YouTube HTTPS handle or matching channel URL');
  const feed = youtubeUrl(settings.feedUrl);
  if (!feed || feed.pathname !== '/feeds/videos.xml' || feed.searchParams.get('channel_id') !== settings.channelId || [...feed.searchParams.keys()].length !== 1) errors.push('feedUrl must be the YouTube HTTPS feed for channelId');
  if (settings.initialVideoId !== undefined || settings.initialVideo !== undefined) {
    if (typeof settings.initialVideoId !== 'string' || !videoIdPattern.test(settings.initialVideoId)) errors.push('initialVideoId must be an 11-character video ID');
    const initial = settings.initialVideo;
    if (!initial || typeof initial !== 'object' || Array.isArray(initial)) errors.push('initialVideo metadata is required for the pinned video');
    else {
      for (const field of ['title', 'summary']) {
        if (typeof initial[field] !== 'string' || !initial[field].trim()) errors.push(`initialVideo.${field} must be a non-empty string`);
      }
      if (!validTimestamp(initial.publishedAt)) errors.push('initialVideo.publishedAt must be a valid UTC timestamp');
      else if (Date.parse(initial.publishedAt) > Date.parse(settings.publishedAfter)) errors.push('initialVideo must be published on or before publishedAfter');
    }
  }
  return errors;
}
