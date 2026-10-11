import { headers } from 'next/headers';
import { serializeJsonLd } from '@/lib/json-ld.mjs';

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
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
