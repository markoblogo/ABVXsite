export default function TagList({ tags }: { tags: string[] }) {
  if (!tags.length) return null;

  return (
    <div className="tag-list" aria-label="Tags">
      {tags.map((tag) => (
        <span key={tag} className="tag-list__item">
          {tag}
        </span>
      ))}
    </div>
  );
}
