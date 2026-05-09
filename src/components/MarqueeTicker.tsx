export default function MarqueeTicker({ items }: { items: string[] }) {
  if (!items.length) return null;

  const loop = [...items, ...items];

  return (
    <div className="marquee-ticker" aria-label="Latest updates">
      <div className="marquee-ticker__track">
        {loop.map((item, index) => (
          <span key={`${item}-${index}`} className="marquee-ticker__item">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
