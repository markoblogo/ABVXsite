// Catalogue edition labels are display copy, not necessarily BCP 47 tags.
export function documentLanguage(value) {
 const language=(value||'').trim();
 const names={english:'en',french:'fr',ukrainian:'uk',russian:'ru','toki pona':'tok'};
 return names[language.toLowerCase()] || (/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(language)?language:'en');
}
