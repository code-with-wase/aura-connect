import { createFileRoute } from "@tanstack/react-router";
import { Loader2, MessageSquarePlus, Pin, Plus, Search, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/aura/app-shell";
import { ChatWindow } from "@/components/aura/chat-window";
import { CreateGroupDialog } from "@/components/aura/create-group-dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/aura/states";
import { UserAvatar } from "@/components/aura/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/context/auth-context";
import type { Chat, User } from "@/lib/api-types";
import { getApiErrorMessage } from "@/lib/axios";
import {
  chatAvatar,
  chatTitle,
  chatUnreadCount,
  formatTime,
  isGroupChat,
  isPresenceOnline,
  messagePreview,
  myParticipant,
  otherParticipant,
} from "@/lib/chat-utils";
import { getSocket } from "@/lib/socket";
import { getPresence, usePresence } from "@/lib/presence-store";
import { cn } from "@/lib/utils";
import { chatService } from "@/services/chatService";
import { userService } from "@/services/userService";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { chat?: string } => {
    const chat = search["chat"];
    return typeof chat === "string" ? { chat } : {};
  },
  head: () => ({
    meta: [
      { title: "Inbox — Nexora" },
      {
        name: "description",
        content:
          "Nexora inbox: real-time direct messages, group chats, attachments, reactions and calls.",
      },
      { property: "og:title", content: "Inbox — Nexora" },
      {
        property: "og:description",
        content: "Real-time direct messages, group chats, attachments, reactions and calls.",
      },
    ],
  }),
  component: InboxPage,
});

function InboxPage() {
  return (
    <AppShell>
      <Inbox />
    </AppShell>
  );
}

const FILTERS = ["All", "Unread", "Direct", "Groups", "Pinned"] as const;
type Filter = (typeof FILTERS)[number];

function Inbox() {
  const { user } = useAuth();
  const { chat: chatParam } = Route.useSearch();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(chatParam ?? null);
  const [filter, setFilter] = useState<Filter>("All");
  const [groupOpen, setGroupOpen] = useState(false);
  /** Subscribes to `presence:updated`, so the list re-renders on presence changes. */
  usePresence(user ?? null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setChats(await chatService.list());
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load conversations"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** The API is serverless, so refresh the list periodically for new messages. */
  useEffect(() => {
    const interval = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      try {
        setChats(await chatService.list());
      } catch {
        /* keep the current list on a transient failure */
      }
    }, 10_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const refresh = () => void load();
    socket.on("message:new", refresh);
    socket.on("presence:updated", refresh);
    return () => {
      socket.off("message:new", refresh);
      socket.off("presence:updated", refresh);
    };
  }, [load]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const isPinned = (chat: Chat) =>
      myParticipant(chat, user?._id)?.isPinned ?? chat.isPinned ?? false;
    const sorted = [...chats].sort((a, b) => {
      const pinDiff = Number(isPinned(b)) - Number(isPinned(a));
      if (pinDiff !== 0) return pinDiff;
      return new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime();
    });
    return sorted.filter((chat) => {
      if (term && !chatTitle(chat, user?._id).toLowerCase().includes(term)) return false;
      if (filter === "Unread") return chatUnreadCount(chat, user?._id) > 0;
      if (filter === "Direct") return !isGroupChat(chat);
      if (filter === "Groups") return isGroupChat(chat);
      if (filter === "Pinned") return isPinned(chat);
      return true;
    });
  }, [chats, query, filter, user?._id]);

  const totalUnread = useMemo(
    () => chats.reduce((sum, chat) => sum + chatUnreadCount(chat, user?._id), 0),
    [chats, user?._id],
  );

  const active = chats.find((chat) => chat._id === activeId) ?? null;

  return (
    <div className="flex min-h-0 flex-1">
      <aside
        className={cn(
          "flex w-full min-w-0 flex-col border-r border-border bg-surface md:w-80 lg:w-96",
          active && "hidden md:flex",
        )}
      >
        <div className="space-y-4 px-4 pb-3 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-[28px] font-bold leading-none tracking-tight text-foreground">
                Nexora
              </h1>
              <p className="mt-1.5 text-[13px] text-muted-foreground">
                {totalUnread > 0
                  ? `${totalUnread} unread message${totalUnread === 1 ? "" : "s"}`
                  : "You are all caught up"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <NewChatDialog
                onCreated={(chat) => {
                  setChats((prev) =>
                    prev.some((c) => c._id === chat._id) ? prev : [chat, ...prev],
                  );
                  setActiveId(chat._id);
                }}
                onNewGroup={() => setGroupOpen(true)}
              />
            </div>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people and messages"
              className="h-12 rounded-2xl border-transparent bg-surface-hover pl-11 text-sm"
              aria-label="Search people and messages"
            />
          </div>
          <div className="-mx-1 flex items-center gap-1 overflow-x-auto pb-0.5">
            {FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold text-muted-foreground transition-colors",
                  filter === item && "bg-accent/12 text-accent",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1 px-2 pb-3">
          {loading && <LoadingState label="Loading conversations…" />}
          {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}
          {!loading && !error && filtered.length === 0 && (
            <EmptyState
              title="No conversations"
              description="Start a new chat to begin messaging your team."
            />
          )}
          {!loading &&
            !error &&
            filtered.map((chat) => {
              const partner = otherParticipant(chat, user?._id);
              const live = getPresence(partner?._id);
              const online = live ? live.isOnline : isPresenceOnline(partner);
              const unread = chatUnreadCount(chat, user?._id);
              const pinned = myParticipant(chat, user?._id)?.isPinned ?? chat.isPinned ?? false;
              const isActive = activeId === chat._id;
              return (
                <button
                  key={chat._id}
                  type="button"
                  onClick={() => setActiveId(chat._id)}
                  className={cn(
                    "relative flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-surface-hover",
                    isActive && "bg-accent/10",
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-full bg-accent" />
                  )}
                  <UserAvatar
                    name={chatTitle(chat, user?._id)}
                    src={chatAvatar(chat, user?._id)}
                    size={48}
                    online={!isGroupChat(chat) && online}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span
                          className={cn(
                            "truncate text-[15px] font-semibold text-foreground",
                            isActive && "text-accent",
                          )}
                        >
                          {chatTitle(chat, user?._id)}
                        </span>
                        {pinned && <Pin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                      </span>
                      <span className="shrink-0 text-[12px] text-muted-foreground">
                        {formatTime(chat.lastMessage?.createdAt ?? chat.updatedAt)}
                      </span>
                    </span>
                    <span className="mt-1 flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "truncate text-[13px] text-muted-foreground",
                          unread > 0 && "font-medium text-foreground",
                        )}
                      >
                        {messagePreview(chat.lastMessage)}
                      </span>
                      {unread > 0 && (
                        <span className="flex h-[22px] min-w-[22px] shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-accent-foreground">
                          {unread}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
        </ScrollArea>
      </aside>

      {active ? (
        <ChatWindow
          key={active._id}
          chat={active}
          chats={chats}
          onBack={() => setActiveId(null)}
          onChatsChanged={() => void load()}
        />
      ) : (
        <section className="hidden flex-1 items-center justify-center bg-background md:flex">
          <div className="max-w-sm text-center">
            <h2 className="text-lg font-semibold text-foreground">Select a conversation</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose a chat from the list or start a new conversation to begin messaging.
            </p>
          </div>
        </section>
      )}

      <CreateGroupDialog
        open={groupOpen}
        onOpenChange={setGroupOpen}
        onCreated={async ({ chatId }) => {
          await load();
          if (chatId) setActiveId(chatId);
        }}
      />
    </div>
  );
}

function NewChatDialog({
  onCreated,
  onNewGroup,
}: {
  onCreated: (chat: Chat) => void;
  onNewGroup: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [creatingId, setCreatingId] = useState<string | null>(null);

  async function search(event: React.FormEvent) {
    event.preventDefault();
    if (!term.trim()) return;
    setSearching(true);
    try {
      setResults(await userService.search(term.trim()));
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Search failed"));
    } finally {
      setSearching(false);
    }
  }

  async function startChat(userId: string) {
    setCreatingId(userId);
    try {
      const chat = await chatService.createPrivate(userId);
      onCreated(chat);
      setOpen(false);
      setTerm("");
      setResults([]);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not start chat"));
    } finally {
      setCreatingId(null);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            aria-label="New conversation"
            className="h-12 w-12 rounded-2xl bg-accent text-accent-foreground shadow-lg shadow-accent/25 hover:bg-accent/90"
          >
            <Plus className="h-5 w-5" strokeWidth={2.6} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            New chat
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onNewGroup}>
            <Users className="mr-2 h-4 w-4" />
            New group
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New conversation</DialogTitle>
            <DialogDescription>
              Search for a colleague by name, username, email or phone.
            </DialogDescription>
          </DialogHeader>
          <form className="flex gap-2" onSubmit={search}>
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search people"
            />
            <Button type="submit" disabled={searching || !term.trim()}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </form>
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {results.map((person) => (
              <div
                key={person._id}
                className="flex items-center gap-3 rounded-md border border-border px-3 py-2"
              >
                <UserAvatar
                  name={person.name}
                  src={person.avatar}
                  size={32}
                  online={person.isOnline}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{person.name}</p>
                  <p className="truncate text-xs text-muted-foreground">@{person.username}</p>
                </div>
                <Button
                  size="sm"
                  disabled={creatingId === person._id}
                  onClick={() => void startChat(person._id)}
                >
                  {creatingId === person._id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Chat"
                  )}
                </Button>
              </div>
            ))}
            {!searching && results.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No results yet.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
