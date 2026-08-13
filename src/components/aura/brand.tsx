import { cn } from "@/lib/utils";

export function NexoraMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "nx-brand-gradient flex items-center justify-center rounded-xl text-accent-foreground shadow-sm",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-[60%] w-[60%]">
        <path
          d="M5 19V6.5L19 17.5V5"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function NexoraWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-foreground",
        className,
      )}
    >
      Nexora
    </span>
  );
}