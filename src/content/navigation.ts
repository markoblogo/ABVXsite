export type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type SocialLink = {
  label: string;
  href: string;
  icon: string;
  external?: boolean;
};

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
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/abvcreative/', icon: 'in', external: true },
  { label: 'Email', href: 'mailto:a.biletskiy@gmail.com', icon: '@' },
  { label: 'GitHub', href: 'https://github.com/markoblogo', icon: 'gh', external: true },
  { label: 'Substack', href: 'https://abvx.substack.com/', icon: 'S', external: true },
  { label: 'Medium', href: 'https://abvcreative.medium.com/', icon: 'M', external: true },
  { label: 'YouTube', href: 'https://www.youtube.com/@ABV_Creative', icon: '▶', external: true },
  { label: 'X', href: 'https://x.com/abv_creative', icon: 'X', external: true },
  { label: 'Bluesky', href: 'https://bsky.app/profile/abvx.xyz', icon: 'BS', external: true },
  { label: 'Behance', href: 'https://www.behance.net/ABV_Creative', icon: 'Be', external: true },
  { label: 'Vivino', href: 'https://www.vivino.com/users/anthony.bile', icon: 'V', external: true },
  { label: 'Instagram', href: 'https://www.instagram.com/abvcreative/', icon: '◎', external: true },
  { label: 'Telegram', href: 'https://t.me/ABVcreative', icon: '↗', external: true },
  { label: 'Amazon Author', href: 'https://www.amazon.com/stores/author/B0FTGN5QNK', icon: 'A', external: true },
];
