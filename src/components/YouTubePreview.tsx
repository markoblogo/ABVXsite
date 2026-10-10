'use client';

import { useId, useRef, useState } from 'react';
import type { ContentImage } from '@/content';
import MediaPanel from './MediaPanel';
import YouTubeEmbed, { youtubeVideoId } from './YouTubeEmbed';

export default function YouTubePreview({ href, title, image }: {
  href: string;
  title: string;
  image?: ContentImage;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [playing, setPlaying] = useState(false);
  const videoId = youtubeVideoId(href);
  if (!videoId) return null;

  return (
    <>
      <button
        className="youtube-preview"
        type="button"
        aria-label={`Play ${title}`}
        aria-haspopup="dialog"
        onClick={() => {
          dialog.current?.showModal();
          setPlaying(true);
        }}
      >
        <MediaPanel
          image={image || { src: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, alt: title }}
          title={title}
          variant="writing"
        />
        <span className="youtube-preview__play" aria-hidden="true">▶</span>
      </button>
      <dialog
        ref={dialog}
        className="youtube-preview-dialog"
        aria-labelledby={titleId}
        onClose={() => setPlaying(false)}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
            event.currentTarget.close();
          }
        }}
      >
        <div className="youtube-preview-dialog__header">
          <span id={titleId}>{title}</span>
          <button type="button" autoFocus aria-label="Close video" onClick={() => dialog.current?.close()}>✕</button>
        </div>
        {playing ? <YouTubeEmbed href={href} title={title} /> : null}
      </dialog>
    </>
  );
}
