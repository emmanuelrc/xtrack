// components/ui/BrandLogo.tsx
import Image from "next/image";

type Props = {
  className?: string;
  variant?: "wordmark" | "mark";
};

/* small helper so we can reuse the logo everywhere; handles dark mode swap */
export default function BrandLogo({ className, variant = "wordmark" }: Props) {
  if (variant === "mark") {
    return (
      <>
        {/* light */}
        <Image
          src="/logo-mark-light.svg"
          alt="xTrack"
          width={28}
          height={28}
          className={`h-7 w-auto dark:hidden ${className ?? ""}`}
          priority
        />
        {/* dark */}
        <Image
          src="/logo-mark-dark.svg"
          alt="xTrack"
          width={28}
          height={28}
          className={`hidden h-7 w-auto dark:block ${className ?? ""}`}
          priority
        />
      </>
    );
  }

  return (
    <>
      {/* light wordmark */}
      <Image
        src="/logo-wordmark-light.svg"
        alt="xTrack"
        width={112}
        height={28}
        className={`h-7 w-auto dark:hidden ${className ?? ""}`}
        priority
      />
      {/* dark wordmark */}
      <Image
        src="/logo-wordmark-dark.svg"
        alt="xTrack"
        width={112}
        height={28}
        className={`hidden h-7 w-auto dark:block ${className ?? ""}`}
        priority
      />
    </>
  );
}
