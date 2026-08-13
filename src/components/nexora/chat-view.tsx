import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  CornerUpLeft,
  Info,
  MoreHorizontal,
  Paperclip,
  Phone,
  Search,
  Send,
  Smile,
  Video,
  X,
  Mic,
} from "lucide-react";

import { NxAvatar } from "./avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Conversation, Message } from "@/lib/nexora-data";

const quickReactions = ["💜", "🔥", "👏", "😄", "🙌"];

function HeaderAction({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: typeof Phone;
  onClick?: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          aria-label={label}
          className="grid h-10 w-10 place-items-center rounded-xl text-muted-foreground transition-all duration-150 hover:bg-surface-hover hover:text-foreground active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Icon className="h-[1.05rem] w-[1.05rem]" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

function Bubble({
  message,
  conversation,
  onReply,
  onReact,
}: {
  message: Message;
  conversation: Conversation;
  onReply: (m: Message) => void;
  onReact: (id: string, emoji: string) => void;
}) {
  const mine = message.author === "me";
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div
      className={cn(
        "nx-rise group/msg relative flex items-end gap-2.5",
        mine ? "flex-row-reverse" : "flex-row",
      )}
    >
      {!mine && conversation.kind === "group" ? (
        <NxAvatar initials={initialsOf(message.author)} accent={conversation.accent} size="sm" />
      ) : null}

      <div className={cn("flex max-w-[min(34rem,78%)] flex-col", mine ? "items-end" : "items-start")}>
        {!mine && conversation.kind === "group" ? (
          <span className="mb-1 ml-1 text-[0.7rem] font-semibold text-brand">{message.author}</span>
        ) : null}

        <div
          className={cn(
            "relative px-4 py-2.5 text-[0.9rem] leading-relaxed",
            mine
              ? "nx-bubble-out rounded-[1.15rem] rounded-br-[0.4rem]"
              : "nx-bubble-in rounded-[1.15rem] rounded-bl-[0.4rem]",
          )}
        >
          {message.replyTo ? (
            <div
              className={cn(
                "mb-2 rounded-xl border-l-2 px-2.5 py-1.5 text-[0.75rem]",
                mine
                  ? "border-white/60 bg-white/15 text-white/85"
                  : "border-brand bg-accent/60 text-muted-foreground",
              )}
            >
              <span className="block font-semibold">{message.replyTo.author}</span>
              <span className="line-clamp-1">{message.replyTo.text}</span>
            </div>
          ) : null}

          <p className="whitespace-pre-wrap">{message.text}</p>

          <span
            className={cn(
              "mt-1 flex items-center justify-end gap-1 text-[0.65rem]",
              mine ? "text-white/70" : "text-muted-foreground",
            )}
          >
            {message.time}
            {mine ? (
              message.status === "read" ? (
                <CheckCheck className="h-3.5 w-3.5" aria-label="Read" />
              ) : message.status === "delivered" ? (
                <CheckCheck className="h-3.5 w-3.5 opacity-60" aria-label="Delivered" />
              ) : (
                <Check className="h-3.5 w-3.5 opacity-60" aria-label="Sent" />
              )
            ) : null}
          </span>
        </div>

        {message.reactions?.length ? (
          <div className={cn("-mt-2 flex gap-1", mine ? "mr-2" : "ml-2")}>
            {message.reactions.map((r) => (
              <span
                key={r.emoji}
                className="nx-rise flex items-center gap-1 rounded-full border border-border bg-elevated px-2 py-0.5 text-[0.7rem] shadow-[var(--shadow-bubble)]"
              >
                {r.emoji}
                <span className="text-muted-foreground">{r.count}</span>
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          "relative flex items-center gap-0.5 self-center rounded-full border border-border bg-elevated/95 px-1 py-1 opacity-0 shadow-[var(--shadow-float)] backdrop-blur transition-all duration-150 group-focus-within/msg:opacity-100 group-hover/msg:opacity-100",
          pickerOpen && "opacity-100",
        )}
      >
        {pickerOpen ? (
          <div className="nx-rise absolute bottom-full left-1/2 mb-2 flex -translate-x-1/2 gap-1 rounded-full border border-border bg-elevated px-2 py-1.5 shadow-[var(--shadow-float)]">
            {quickReactions.map((emoji) => (
              <button
                key={emoji}
                aria-label={`React with ${emoji}`}
                onClick={() => {
                  onReact(message.id, emoji);
                  setPickerOpen(false);
                }}
                className="text-base transition-transform duration-150 hover:scale-125"
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : null}
        <button
          aria-label="Add reaction"
          onClick={() => setPickerOpen((v) => !v)}
          className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          <Smile className="h-4 w-4" />
        </button>
        <button
          aria-label="Reply to message"
          onClick={() => onReply(message)}
          className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          <CornerUpLeft className="h-4 w-4" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="More message actions"
              className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-2xl">
            <DropdownMenuItem>Copy text</DropdownMenuItem>
            <DropdownMenuItem>Forward</DropdownMenuItem>
            <DropdownMenuItem>Pin message</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
}

export function ChatView({
  conversation,
  onBack,
  onToggleInfo,
  infoOpen,
}: {
  conversation: Conversation;
  onBack: () => void;
  onToggleInfo: () => void;
  infoOpen: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>(conversation.messages);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMessages(conversation.messages);
    setReplyTo(null);
    setDraft("");
    inputRef.current?.focus();
  }, [conversation]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  function send() {
    const text = draft.trim();
    if (!text) return;
    const next: Message = {
      id: `local-${Date.now()}`,
      author: "me",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "sent",
      ...(replyTo
        ? {
            replyTo: {
              author: replyTo.author === "me" ? "You" : replyTo.author,
              text: replyTo.text,
            },
          }
        : {}),
    };
    setMessages((prev) => [...prev, next]);
    setDraft("");
    setReplyTo(null);
    setSending(true);
    window.setTimeout(() => setSending(false), 320);
    inputRef.current?.focus();
  }

  function react(id: string, emoji: string) {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const existing = m.reactions?.find((r) => r.emoji === emoji);
        const reactions = existing
          ? m.reactions!.map((r) => (r.emoji === emoji ? { ...r, count: r.count + 1 } : r))
          : [...(m.reactions ?? []), { emoji, count: 1 }];
        return { ...m, reactions };
      }),
    );
  }

  return (
    <section className="flex h-full min-h-0 flex-col">
      <header className="nx-glass z-10 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-x-0 border-t-0 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onBack}
            aria-label="Back to conversations"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground lg:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <NxAvatar
            initials={conversation.initials}
            accent={conversation.accent}
            online={conversation.online}
          />
          <div className="min-w-0">
            <h2 className="truncate text-[0.95rem] font-bold">{conversation.name}</h2>
            <p className="flex items-center gap-1.5 truncate text-[0.7rem] text-muted-foreground">
              <span className="font-medium text-brand">{conversation.role}</span>
              <span aria-hidden="true">•</span>
              {conversation.typing ? (
                <span className="flex items-center gap-1 text-brand">
                  typing
                  <span className="flex gap-0.5">
                    <span className="nx-dot h-1 w-1 rounded-full bg-brand" />
                    <span
                      className="nx-dot h-1 w-1 rounded-full bg-brand"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="nx-dot h-1 w-1 rounded-full bg-brand"
                      style={{ animationDelay: "300ms" }}
                    />
                  </span>
                </span>
              ) : (
                <span className="truncate">{conversation.lastSeen}</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <span className="hidden sm:flex">
            <HeaderAction label="Search in conversation" icon={Search} />
          </span>
          <HeaderAction label="Audio call" icon={Phone} />
          <HeaderAction label="Video call" icon={Video} />
          <span className="mx-1.5 hidden h-6 w-px bg-border sm:block" />
          <HeaderAction
            label={infoOpen ? "Hide details" : "Conversation details"}
            icon={Info}
            onClick={onToggleInfo}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="More actions"
                className="grid h-10 w-10 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
              >
                <MoreHorizontal className="h-[1.05rem] w-[1.05rem]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-2xl">
              <DropdownMenuItem>Mute notifications</DropdownMenuItem>
              <DropdownMenuItem>Select messages</DropdownMenuItem>
              <DropdownMenuItem>Export chat</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Clear conversation</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="nx-canvas nx-grain relative min-h-0 flex-1 overflow-y-auto">
        <div className="relative mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 sm:px-8">
          <div className="mx-auto rounded-full border border-border bg-surface/70 px-3 py-1 text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase backdrop-blur">
            Today
          </div>
          {messages.map((m) => (
            <Bubble
              key={m.id}
              message={m}
              conversation={conversation}
              onReply={(msg) => {
                setReplyTo(msg);
                inputRef.current?.focus();
              }}
              onReact={react}
            />
          ))}
          <div ref={endRef} />
        </div>
      </div>

      <div className="relative px-3 pt-2 pb-4 sm:px-6 sm:pb-6">
        <div className="mx-auto max-w-3xl">
          {replyTo ? (
            <div className="nx-rise mb-2 flex items-center gap-3 rounded-2xl border border-border bg-surface px-3.5 py-2.5">
              <span className="h-8 w-[3px] shrink-0 rounded-full bg-brand" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-[0.7rem] font-semibold text-brand">
                  Replying to {replyTo.author === "me" ? "yourself" : replyTo.author}
                </p>
                <p className="truncate text-xs text-muted-foreground">{replyTo.text}</p>
              </div>
              <button
                aria-label="Cancel reply"
                onClick={() => setReplyTo(null)}
                className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-surface-hover"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          <div className="flex items-end gap-2 rounded-[1.6rem] border border-border bg-surface p-2 shadow-[var(--shadow-float)] transition-all duration-200 focus-within:border-brand/45 focus-within:shadow-[0_0_0_4px_color-mix(in_oklab,var(--brand)_10%,transparent),var(--shadow-float)]">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  aria-label="Attach a file"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-all hover:bg-surface-hover hover:text-foreground active:scale-95"
                >
                  <Paperclip className="h-[1.05rem] w-[1.05rem]" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Attach</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  aria-label="Insert emoji"
                  onClick={() => setDraft((d) => `${d}🙂`)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-all hover:bg-surface-hover hover:text-foreground active:scale-95"
                >
                  <Smile className="h-[1.05rem] w-[1.05rem]" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Emoji</TooltipContent>
            </Tooltip>

            <label className="min-w-0 flex-1 py-1.5">
              <span className="sr-only">Write a message</span>
              <textarea
                ref={inputRef}
                rows={1}
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={`Write a message to ${conversation.name.split(" ")[0]}…`}
                className="max-h-[140px] w-full resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
              />
            </label>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  aria-label="Record a voice note"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-all hover:bg-surface-hover hover:text-foreground active:scale-95"
                >
                  <Mic className="h-[1.05rem] w-[1.05rem]" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Voice note</TooltipContent>
            </Tooltip>

            <button
              onClick={send}
              disabled={!draft.trim()}
              aria-label="Send message"
              className={cn(
                "grid h-10 w-10 shrink-0 place-items-center rounded-full text-primary-foreground transition-all duration-200 disabled:opacity-40",
                sending && "scale-90",
                draft.trim() && "hover:-translate-y-0.5 active:scale-95",
              )}
              style={{ backgroundImage: "var(--gradient-brand)" }}
            >
              <Send className="h-[1.05rem] w-[1.05rem]" />
            </button>
          </div>

          <p className="mt-2 hidden text-center text-[0.65rem] text-muted-foreground sm:block">
            <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-sans">
              Enter
            </kbd>{" "}
            to send ·{" "}
            <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-sans">
              Shift + Enter
            </kbd>{" "}
            for a new line
          </p>
        </div>
      </div>
    </section>
  );
}