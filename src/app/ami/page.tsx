import AmiLanding from '@/components/ami/AmiLanding';
import { amiCopy } from '@/lib/ami-content';
import { absoluteUrl, defaultOgImage, metadataWithImage } from '@/lib/seo';
import type { Metadata } from 'next';

const copy = amiCopy.en;

export const metadata: Metadata = {
  ...metadataWithImage({
    title: copy.title,
    description: copy.description,
    canonicalPath: copy.path,
    image: defaultOgImage,
  }),
  alternates: {
    canonical: absoluteUrl(copy.path),
    languages: {
      en: absoluteUrl('/ami'),
      fr: absoluteUrl('/fr/ami'),
    },
  },
};

export default function AmiPage() {
  return <AmiLanding locale="en" />;
}
