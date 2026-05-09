import Image from 'next/image';

type BrandMarkProps = {
  className?: string;
  priority?: boolean;
};

export default function BrandMark({ className, priority = false }: BrandMarkProps) {
  return (
    <span className={className}>
      <Image
        src="/brand/abv-mark.png"
        alt=""
        width={160}
        height={160}
        priority={priority}
      />
    </span>
  );
}
