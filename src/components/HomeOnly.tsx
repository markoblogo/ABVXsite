'use client';

import {staticLocation} from '@/lib/static-locales.mjs';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export default function HomeOnly({ children }: { children: ReactNode }) {
  return staticLocation(usePathname())?.path === '/' ? children : null;
}
