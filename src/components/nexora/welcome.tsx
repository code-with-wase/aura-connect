import { NexoraMark } from "./logo";

export function Welcome({ onNewChat }: { onNewChat: () => void }) {
  return (
    <div className="nx-canvas nx-grain relative grid h-full place-items-center overflow-hidden px-6">
      <div className="relative z-10 max-w-md text-center">
        <div className="nx-float relative mx-auto grid h-24 w-24 place-items-center">
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-[2rem] opacity-25 blur-2xl"
            style={{ backgroundImage: "var(--gradient-brand)" }}
          />
          <NexoraMark className="h-16 w-16" />
        </div>
        <h1 className="mt-8 text-2xl font-bold sm:text-3xl">
          Your conversations, beautifully connected.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Select a conversation on the left, or start a new one. Nexora keeps every thread calm,
          fast and easy to read.
        </p>
        <button
          onClick={onNewChat}
          className="mt-7 rounded-full px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-float)] transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
          style={{ backgroundImage: "var(--gradient-brand)" }}
        >
          Start a conversation
        </button>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-2 text-[0.7rem] text-muted-foreground">
          {["End-to-end private", "Threaded replies", "Reactions", "Voice notes"].map((f) => (
            <span key={f} className="rounded-full border border-border bg-surface/70 px-3 py-1.5">
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}