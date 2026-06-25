"use client";

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-800",
  "bg-amber-100 text-amber-800",
  "bg-emerald-100 text-emerald-800",
  "bg-violet-100 text-violet-800",
  "bg-rose-100 text-rose-800",
  "bg-cyan-100 text-cyan-800",
  "bg-orange-100 text-orange-800",
  "bg-teal-100 text-teal-800",
];

function getColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface WorldAvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: number;
}

export function WorldAvatar({ name, imageUrl, size = 20 }: WorldAvatarProps) {
  const initial = name.charAt(0).toUpperCase();
  const colorClass = getColor(name);

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/api/blob?pathname=${encodeURIComponent(imageUrl)}`}
        alt={name}
        width={size}
        height={size}
        className="rounded-sm object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-sm font-semibold shrink-0 ${colorClass}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.55) }}
    >
      {initial}
    </span>
  );
}
