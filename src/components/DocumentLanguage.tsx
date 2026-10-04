"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function DocumentLanguage({ writingLanguages }: { writingLanguages: Record<string, string> }) {
  const pathname = usePathname();
  const language = pathname.startsWith('/fr/') ? 'fr' : writingLanguages[pathname] || 'en';
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  return null;
}
