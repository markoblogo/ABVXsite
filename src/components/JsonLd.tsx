import { headers } from 'next/headers';

type JsonLdProps = {
  id: string;
  data: unknown;
};

export default async function JsonLd({ id, data }: JsonLdProps) {
  const nonce = (await headers()).get('x-nonce') || undefined;

  return (
    <script
      id={id}
      nonce={nonce}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
