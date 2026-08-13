import { cn } from "@/lib/utils";

export function NxAvatar({
  initials,
  accent,
  online,
  size = "md",
  className,
}: {
  initials: string;
  accent?: string | undefined;
  online?: boolean | undefined;
  size?: "sm" | "md" | "lg" | "xl" | undefined;
  className?: string | undefined;
}) {
  const sizes = {
    sm: "h-8 w-8 text-[0.65rem]",
    md: "h-11 w-11 text-xs",
    lg: "h-14 w-14 text-sm",
    xl: "h-24 w-24 text-2xl",
  } as const;

  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "grid place-items-center rounded-[38%] font-semibold tracking-wide text-white",
          sizes[size],
        )}
        style={{
          backgroundImage: `linear-gradient(140deg, ${accent ?? "var(--brand)"}, color-mix(in oklab, ${accent ?? "var(--brand)"} 55%, var(--cyan)))`,
        }}
      >
        {initials}
      </span>
      {online ? (
        <span
          className="nx-pulse-ring absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-surface bg-online"
          aria-label="Online"
          role="img"
        />
      ) : null}
    </span>
  );
}