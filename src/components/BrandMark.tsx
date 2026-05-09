import Image from 'next/image';

type BrandMarkProps = {
  className?: string;
  priority?: boolean;
};

export default function BrandMark({ className, priority = false }: BrandMarkProps) {
  return (
    <span className={className}>
      <Image
        src="/brand/abv-mark-dark.png"
        alt=""
        width={512}
        height={512}
        priority={priority}
      />
    </span>
  );
}
