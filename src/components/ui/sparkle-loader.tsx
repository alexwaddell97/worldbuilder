"use client";

import { cn } from "@/lib/utils";

const SPARKLE_PATH =
  "M 249.406,377.223 C 243.878,377.299 242.085,347.608 237.440,334.153 C 232.795,320.698 226.338,303.355 215.575,292.141 C 204.811,280.926 188.554,271.345 175.066,266.165 C 161.578,260.985 133.315,256.693 133.357,250.583 C 133.400,244.442 163.350,241.791 176.474,236.269 C 189.599,230.747 206.470,220.793 216.240,209.857 C 226.009,198.922 233.857,180.337 237.965,166.601 C 242.074,152.865 245.064,123.660 250.329,123.571 C 255.625,123.481 257.789,152.659 262.180,166.406 C 266.571,180.153 273.851,197.471 283.436,209.703 C 293.020,221.935 310.340,230.668 323.348,236.747 C 336.356,242.825 365.652,244.190 365.671,250.589 C 365.691,256.892 337.374,259.735 324.046,265.381 C 310.717,271.028 293.226,281.474 284.550,293.288 C 275.873,305.102 266.689,321.694 262.768,335.152 C 258.847,348.611 254.913,377.147 249.406,377.223 Z";

interface SparkleLoaderProps {
  size?: number;
  className?: string;
}

export function SparkleLoader({ size = 36, className }: SparkleLoaderProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 500"
      width={size}
      height={size}
      className={cn(
        "[animation:sparkle-pulse_2s_ease-in-out_infinite] text-foreground",
        className
      )}
      aria-hidden="true"
    >
      <path d={SPARKLE_PATH} fill="currentColor" />
    </svg>
  );
}

export function SparkleLoaderScreen({ className }: { className?: string }) {
  return (
    <div className={cn("h-full flex items-center justify-center", className)}>
      <SparkleLoader />
    </div>
  );
}
