import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  className?: string;
  href?: string;
  height?: number;
};

export function BrandLogo({
  className = "h-10 w-auto object-contain",
  href,
  height = 40,
}: BrandLogoProps) {
  const logo = (
    <Image
      src="/mml-logo.png"
      alt="MOTO-MAQLAB"
      width={Math.round(height * 3.2)}
      height={height}
      className={className}
      priority
    />
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0">
        {logo}
      </Link>
    );
  }

  return logo;
}
