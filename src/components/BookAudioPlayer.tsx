"use client";

import { useRef, useState } from 'react';

export default function BookAudioPlayer({ src, title }: { src: string; title: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  function start() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = src;
    setLoaded(true);
    void audio.play().catch(() => setFailed(true));
  }

  return (
    <div>
      {!loaded ? (
        <div className="book-action-links">
          <button type="button" className="book-action-links__link book-action-links__link--primary" onClick={start}>
            Listen to audiobook
          </button>
        </div>
      ) : null}
      <audio ref={audioRef} controls preload="none" hidden={!loaded} aria-label={`${title} audiobook`} style={{ width: '100%' }} />
      {failed ? <p role="status">Playback could not start. Try the player controls or use the Audio download link above.</p> : null}
      <noscript><p>Use the Audio or Audiobook links above to download the recording.</p></noscript>
    </div>
  );
}
