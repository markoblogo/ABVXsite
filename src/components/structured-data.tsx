import Script from 'next/script';

type CreativeWorkItem = {
  id: string;
  name: string;
  url: string;
  image?: string;
  type?: string;
};

export default function StructuredData({
  id,
  items,
}: {
  id: string;
  items: CreativeWorkItem[];
}) {
  if (!items.length) return null;

  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': item.type || 'CreativeWork',
        '@id': item.url,
        name: item.name,
        url: item.url,
        image: item.image,
      },
    })),
  };

  return (
    <Script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
