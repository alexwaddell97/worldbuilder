import Image from "next/image";
import { APP_NAME } from "@/config/app";
import { cn } from "@/lib/utils";

interface AppWordmarkProps {
  className?: string;
  height?: number;
}

export function AppWordmark({ className, height = 28 }: AppWordmarkProps) {
  const width = Math.round(height * 5.1);
  return (
    <Image
      src="/Subcreation.webp"
      alt={APP_NAME}
      width={width}
      height={height}
      className={cn("object-contain", className)}
      priority
    />
  );
}
