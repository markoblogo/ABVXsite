'use client';

import { useState } from 'react';
import Image from 'next/image';

type ZoomableImageProps = {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  imgClassName?: string;
  onClickClassName?: string;
};

export default function ZoomableImage({
  src,
  alt = '',
  width = 320,
  height = 320,
  sizes,
  className = '',
  imgClassName = '',
  onClickClassName = '',
}: ZoomableImageProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        className={`${imgClassName} cursor-zoom-in ${onClickClassName}`}
        onClick={() => setOpen(true)}
      />

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={() => setOpen(false)}
        >
          <Image
            src={src}
            alt={alt}
            width={1600}
            height={1600}
            sizes="90vw"
            className={`h-auto max-h-[90vh] w-auto max-w-[90vw] rounded-xl object-contain shadow-2xl ${className}`}
          />
        </div>
      ) : null}
    </>
  );
}
