"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function DocumentLanguage({ writingLanguages = {}, languageOverride }: { writingLanguages?: Record<string, string>; languageOverride?: string }) {
  const pathname = usePathname();
  const language = languageOverride || (pathname.startsWith('/fr/') ? 'fr' : writingLanguages[pathname] || 'en');
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language, pathname]);
  return null;
}
