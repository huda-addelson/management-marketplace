import Image from "next/image";

import { cn } from "@/lib/utils";

export function AddelsonLogo({
  size = 48,
  className,
  priority = false,
  decorative = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
  decorative?: boolean;
}) {
  return (
    <Image
      src="/addelson-store.png"
      width={size}
      height={size}
      alt={decorative ? "" : "Addelson Store"}
      aria-hidden={decorative || undefined}
      priority={priority}
      className={cn("shrink-0 rounded-[22%] bg-white object-contain drop-shadow-[0_8px_18px_rgba(0,62,170,0.22)]", className)}
    />
  );
}
