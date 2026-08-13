import { cn } from "@/lib/utils";

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
          className="h-full w-full rounded-md border border-border object-cover"
          loading="lazy"
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center rounded-md border border-border bg-secondary text-xs font-semibold text-secondary-foreground"
          aria-hidden
        >
          {initials}
        </span>
      )}
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface bg-online" />
      )}
    </span>
  );
}
