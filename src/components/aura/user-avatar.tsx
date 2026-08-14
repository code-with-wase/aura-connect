import { cn } from "@/lib/utils";

const PALETTES = [
  "linear-gradient(145deg, oklch(0.62 0.2 300), oklch(0.52 0.22 296))",
  "linear-gradient(145deg, oklch(0.66 0.13 195), oklch(0.52 0.12 205))",
  "linear-gradient(145deg, oklch(0.64 0.18 262), oklch(0.52 0.2 268))",
  "linear-gradient(145deg, oklch(0.68 0.15 155), oklch(0.55 0.14 165))",
  "linear-gradient(145deg, oklch(0.7 0.16 55), oklch(0.58 0.17 40))",
  "linear-gradient(145deg, oklch(0.66 0.17 15), oklch(0.55 0.18 8))",
];

function paletteFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) % 9973;
  return PALETTES[hash % PALETTES.length];
}

export function UserAvatar({
  name,
  src,
  size = 40,
  online,
  className,
}: {
  name?: string | undefined;
  src?: string | null | undefined;
  size?: number | undefined;
  online?: boolean | undefined;
  className?: string | undefined;
}) {
  const initials = (name ?? "?")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <span className={cn("relative inline-flex shrink-0", className)} style={{ width: size, height: size }}>
      {src ? (
        <img
          src={src}
          alt={name ?? "User avatar"}
          className="h-full w-full rounded-[35%] object-cover"
          loading="lazy"
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center rounded-[35%] text-[13px] font-semibold tracking-tight text-white"
          style={{ backgroundImage: paletteFor(name ?? "?") }}
          aria-hidden
        >
          {initials}
        </span>
      )}
      {online && (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface bg-online" />
      )}
    </span>
  );
}
