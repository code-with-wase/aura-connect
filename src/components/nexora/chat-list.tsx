import { useMemo, useState } from "react";
import { Plus, Search, SlidersHorizontal, Pin } from "lucide-react";

import { NxAvatar } from "./avatar";
import { NexoraMark, NexoraWordmark } from "./logo";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { me, type Conversation } from "@/lib/nexora-data";

const filters = ["All", "Unread", "Groups", "Pinned"] as const;

export function ChatList({
  items,
  activeId,
  onSelect,
  onNewChat,
  onOpenProfile,
}: {
  items: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onOpenProfile: () => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");

  const visible = useMemo(() => {
    return items.filter((c) => {
      const matches = c.name.toLowerCase().includes(query.trim().toLowerCase());
      if (!matches) return false;
      if (filter === "Unread") return Boolean(c.unread);
      if (filter === "Groups") return c.kind === "group";
      if (filter === "Pinned") return Boolean(c.pinned);
      return true;
    });
  }, [items, query, filter]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-sidebar">
      <div className="flex items-center gap-3 px-5 pt-5 pb-4">
        <NexoraMark className="h-9 w-9" />
        <div className="min-w-0 flex-1">
          <NexoraWordmark />
          <p className="truncate text-[0.7rem] text-muted-foreground">Conversations, refined</p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onOpenProfile}
              aria-label="Open your profile"
              className="rounded-[38%] outline-none ring-offset-2 ring-offset-sidebar transition-transform duration-150 hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <NxAvatar initials={me.initials} size="sm" online />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Your profile</TooltipContent>
        </Tooltip>
      </div>

      <div className="px-5">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-3.5 py-2.5 transition-shadow duration-150 focus-within:border-brand/50 focus-within:shadow-[0_0_0_4px_color-mix(in_oklab,var(--brand)_12%,transparent)]">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people and groups"
            aria-label="Search conversations"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Conversation filters"
        className="flex gap-1.5 overflow-x-auto px-5 py-4"
      >
        {filters.map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors duration-150",
              filter === f
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-surface-hover",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-28">
        {visible.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            Nothing here yet. Try another filter or start a new conversation.
          </p>
        ) : null}
        {visible.map((c) => {
          const active = c.id === activeId;
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              aria-current={active ? "true" : undefined}
              className={cn(
                "group relative grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-accent/70 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--brand)_22%,transparent)]"
                  : "hover:bg-surface-hover",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-1/2 left-0 h-7 w-[3px] -translate-y-1/2 rounded-full bg-brand transition-all duration-150",
                  active ? "opacity-100" : "opacity-0 group-hover:opacity-40",
                )}
              />
              <NxAvatar initials={c.initials} accent={c.accent} online={c.online} />
              <span className="min-w-0">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold">{c.name}</span>
                  {c.pinned ? (
                    <Pin className="h-3 w-3 shrink-0 text-muted-foreground" aria-label="Pinned" />
                  ) : null}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {c.typing ? (
                    <span className="font-medium text-brand">typing…</span>
                  ) : (
                    c.preview
                  )}
                </span>
              </span>
              <span className="flex flex-col items-end gap-1.5">
                <span className="text-[0.65rem] text-muted-foreground">{c.previewTime}</span>
                {c.unread ? (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 text-[0.65rem] font-bold text-primary-foreground">
                    {c.unread}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-end p-5">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onNewChat}
              aria-label="Start a new conversation"
              className="pointer-events-auto group flex items-center gap-2 rounded-full px-4 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-float)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              style={{ backgroundImage: "var(--gradient-brand)" }}
            >
              <Plus className="h-5 w-5 transition-transform duration-200 group-hover:rotate-90" />
              <span className="max-w-0 overflow-hidden whitespace-nowrap transition-all duration-200 group-hover:max-w-[7rem]">
                New chat
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">New conversation</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}