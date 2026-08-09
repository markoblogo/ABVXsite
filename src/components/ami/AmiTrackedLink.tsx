'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string> }) => void;
  }
}

type Props = {
  href: string;
  eventName: string;
  props: Record<string, string>;
  children: ReactNode;
  className?: string;
  external?: boolean;
};

export default function AmiTrackedLink({ href, eventName, props, children, className, external = false }: Props) {
  const track = () => {
    if (typeof window !== 'undefined' && typeof window.plausible === 'function') {
      window.plausible(eventName, { props });
    }
  };

  if (external) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer" onClick={track}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className} onClick={track}>
      {children}
    </Link>
  );
}
