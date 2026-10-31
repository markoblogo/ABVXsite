"use client";
import {documentLanguage} from '@/lib/document-language.mjs';


import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function DocumentLanguage({ writingLanguages = {}, languageOverride }: { writingLanguages?: Record<string, string>; languageOverride?: string }) {
  const pathname = usePathname();
  const language = documentLanguage(languageOverride || (pathname === '/uk' || pathname.startsWith('/uk/') ? 'uk' : pathname === '/fr' || pathname.startsWith('/fr/') ? 'fr' : writingLanguages[pathname] || 'en'));
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language, pathname]);
  return null;
}
