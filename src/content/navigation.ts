export type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type SocialLink = {
  label: string;
  href: string;
  icon: SocialIconName;
  external?: boolean;
};

export type SocialIconName =
  | 'linkedin'
  | 'email'
  | 'github'
  | 'substack'
  | 'medium'
  | 'youtube'
  | 'x'
  | 'bluesky'
  | 'behance'
  | 'vivino'
  | 'instagram'
  | 'telegram'
  | 'whatsapp'
  | 'amazon-author';

export const footerPrimaryLinks: FooterLink[] = [
  { label: 'Focus', href: '/focus' },
  { label: 'Systems', href: '/systems' },
  { label: 'Books', href: '/books' },
  { label: 'Writing', href: '/writing' },
  { label: 'About', href: '/about' },
  { label: 'Contact / Work with me', href: '/about' },
];

export const footerArchiveLinks: FooterLink[] = [
  { label: 'Cropto', href: '/focus' },
  { label: 'ABVX Press', href: '/books' },
  { label: 'Tech Lab', href: '/systems' },
  { label: 'Lang Lab', href: '/systems' },
  { label: 'Blogs', href: '/writing' },
  { label: 'Projects archive', href: '/systems' },
  { label: 'Books archive', href: '/books' },
  { label: 'Links', href: '/about' },
];

export const socialLinks: SocialLink[] = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/abvcreative/', icon: 'linkedin', external: true },
  { label: 'Email', href: 'mailto:a.biletskiy@gmail.com', icon: 'email' },
  { label: 'GitHub', href: 'https://github.com/markoblogo', icon: 'github', external: true },
  { label: 'Substack', href: 'https://abvx.substack.com/', icon: 'substack', external: true },
  { label: 'Medium', href: 'https://abvcreative.medium.com/', icon: 'medium', external: true },
  { label: 'YouTube', href: 'https://www.youtube.com/@ABV_Creative', icon: 'youtube', external: true },
  { label: 'X', href: 'https://x.com/abv_creative', icon: 'x', external: true },
  { label: 'Bluesky', href: 'https://bsky.app/profile/abvx.xyz', icon: 'bluesky', external: true },
  { label: 'Behance', href: 'https://www.behance.net/ABV_Creative', icon: 'behance', external: true },
  { label: 'Vivino', href: 'https://www.vivino.com/users/anthony.bile', icon: 'vivino', external: true },
  { label: 'Instagram', href: 'https://www.instagram.com/abvcreative/', icon: 'instagram', external: true },
  { label: 'Telegram', href: 'https://t.me/ABVcreative', icon: 'telegram', external: true },
  { label: 'WhatsApp', href: 'https://wa.me/33635189545', icon: 'whatsapp', external: true },
  { label: 'Amazon Author', href: 'https://www.amazon.com/stores/author/B0FTGN5QNK', icon: 'amazon-author', external: true },
];
