'use client';

import { useState } from 'react';

type ZoomableImageProps = {
  src: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  onClickClassName?: string;
};

export default function ZoomableImage({
  src,
  alt = '',
  className = '',
  imgClassName = '',
  onClickClassName = '',
}: ZoomableImageProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={`${imgClassName} cursor-zoom-in ${onClickClassName}`}
        loading="lazy"
        onClick={() => setOpen(true)}
      />

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={() => setOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className={`max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl ${className}`}
          />
        </div>
      ) : null}
    </>
  );
}
