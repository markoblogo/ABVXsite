import type { ImgHTMLAttributes } from 'react';

// Keep runtime media behind its revocation-aware route rather than the
// persistent Next image cache. Cards request appropriately sized derivatives.
export default function RuntimeWritingImage(props: ImgHTMLAttributes<HTMLImageElement> & { src: string }) {
  const url = new URL(props.src, 'https://abvx.xyz');
  const variant = (width: number) => {
    const query = new URLSearchParams(url.search);
    query.set('w', String(width));
    return `${url.pathname}?${query}`;
  };
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt || ''} src={variant(640)} srcSet={[320, 640, 960, 1280].map(width => `${variant(width)} ${width}w`).join(', ')} />
  );
}
