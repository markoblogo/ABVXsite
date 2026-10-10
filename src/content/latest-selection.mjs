function dateValue(item) {
  const value = item.catalogueAddedAt === undefined ? item.publishedAt : item.catalogueAddedAt;
  const time = value ? new Date(value).valueOf() : 0;
  return Number.isFinite(time) ? time : 0;
}

export function selectLatestSectionEntry(items, section, excludedSlug) {
  return items
    .filter((item) => item.slug !== excludedSlug)
    .filter((item) => item.appearsIn.includes(section))
    .filter((item) => item.catalogueAddedAt !== null)
    .sort((a, b) => {
      const dateDifference = dateValue(b) - dateValue(a);
      if (dateDifference) return dateDifference;
      if (a.sortRank !== b.sortRank) return a.sortRank - b.sortRank;
      return a.title.localeCompare(b.title);
    })[0];
}
