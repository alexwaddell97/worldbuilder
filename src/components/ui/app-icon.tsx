import Image from "next/image";
import { APP_NAME } from "@/config/app";
import { cn } from "@/lib/utils";

interface AppIconProps {
  className?: string;
  size?: number;
}

export function AppIcon({ className, size = 28 }: AppIconProps) {
  return (
    <Image
      src="/SubcreationIcon.webp"
      alt={`${APP_NAME} icon`}
      width={size}
      height={size}
      className={cn("object-contain", className)}
      priority
    />
  );
}
