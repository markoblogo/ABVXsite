'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export default function HomeOnly({ children }: { children: ReactNode }) {
  return usePathname() === '/' ? children : null;
}
