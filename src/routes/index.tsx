import { createFileRoute } from "@tanstack/react-router";
import { Loader2, MessageSquarePlus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/aura/app-shell";
import { ChatWindow } from "@/components/aura/chat-window";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/context/auth-context";
import type { Chat, User } from "@/lib/api-types";
import { getApiErrorMessage } from "@/lib/axios";
import { chatAvatar, chatTitle, formatTime, messagePreview, otherParticipant } from "@/lib/chat-utils";
import { getSocket } from "@/lib/socket";
import { cn } from "@/lib/utils";
import { chatService } from "@/services/chatService";
import { userService } from "@/services/userService";

export const Route = createFileRoute("/")({
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

function Inbox() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

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
    const sorted = [...chats].sort(
      (a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime(),
    );
    if (!term) return sorted;
    return sorted.filter((chat) => chatTitle(chat, user?._id).toLowerCase().includes(term));
  }, [chats, query, user?._id]);

  const active = chats.find((chat) => chat._id === activeId) ?? null;

  return (
    <div className="flex min-h-0 flex-1">
      <aside
        className={cn(
          "flex w-full min-w-0 flex-col border-r border-border bg-surface md:w-80 lg:w-96",
          active && "hidden md:flex",
        )}
      >
        <div className="space-y-3 border-b border-border px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-foreground">Chats</h1>
            <NewChatDialog
              onCreated={(chat) => {
                setChats((prev) => (prev.some((c) => c._id === chat._id) ? prev : [chat, ...prev]));
                setActiveId(chat._id);
              }}
            />
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conversations"
              className="pl-9"
              aria-label="Search conversations"
            />
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1">
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
              return (
                <button
                  key={chat._id}
                  type="button"
                  onClick={() => setActiveId(chat._id)}
                  className={cn(
                    "flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-surface-hover",
                    activeId === chat._id && "bg-accent/8",
                  )}
                >
                  <UserAvatar
                    name={chatTitle(chat, user?._id)}
                    src={chatAvatar(chat, user?._id)}
                    online={partner?.isOnline}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {chatTitle(chat, user?._id)}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {formatTime(chat.lastMessage?.createdAt ?? chat.updatedAt)}
                      </span>
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-muted-foreground">
                        {messagePreview(chat.lastMessage)}
                      </span>
                      {(chat.unreadCount ?? 0) > 0 && (
                        <span className="rounded-full bg-accent px-1.5 text-[10px] font-semibold text-accent-foreground">
                          {chat.unreadCount}
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
    </div>
  );
}

function NewChatDialog({ onCreated }: { onCreated: (chat: Chat) => void }) {
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          New
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New conversation</DialogTitle>
          <DialogDescription>Search for a colleague by name, username, email or phone.</DialogDescription>
        </DialogHeader>
        <form className="flex gap-2" onSubmit={search}>
          <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search people" />
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
              <UserAvatar name={person.name} src={person.avatar} size={32} online={person.isOnline} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{person.name}</p>
                <p className="truncate text-xs text-muted-foreground">@{person.username}</p>
              </div>
              <Button size="sm" disabled={creatingId === person._id} onClick={() => void startChat(person._id)}>
                {creatingId === person._id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Chat"}
              </Button>
            </div>
          ))}
          {!searching && results.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No results yet.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
