export function validateNativeWritingVideo(data, now = Date.now()) {
  if (data.videoUrl === undefined && data.videoUploadedAt === undefined) return [];
  const errors = [];
  if (typeof data.videoUrl !== 'string' || !/^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/.test(data.videoUrl)) {
    errors.push('videoUrl must be a canonical YouTube HTTPS watch URL with an 11-character video ID');
  }
  const value = data.videoUploadedAt;
  const match = typeof value === 'string' && value.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/);
  const time = match ? Date.parse(value) : NaN;
  const civilTime = match ? Date.parse(`${match[1]}Z`) : NaN;
  if (!match || !Number.isFinite(time) || !Number.isFinite(civilTime)
    || new Date(civilTime).toISOString() !== `${match[1]}.000Z` || time > now) {
    errors.push('videoUploadedAt must be a real, non-future ISO timestamp with a timezone; video fields are required together');
  }
  return errors;
}

export function videoFeedTimestamp(value) {
  return new Date(value).toISOString();
}
