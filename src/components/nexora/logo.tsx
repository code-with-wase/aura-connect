export function NexoraMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`relative grid shrink-0 place-items-center rounded-[0.9rem] ${className}`}
      style={{ backgroundImage: "var(--gradient-brand)" }}
    >
      <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" fill="none" stroke="white" strokeWidth="2.1">
        <path d="M5 19V6.5L19 17.5V5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function NexoraWordmark() {
  return (
    <span className="font-display text-[1.05rem] font-bold tracking-tight">
      Nexora
      <span className="text-brand">.</span>
    </span>
  );
}