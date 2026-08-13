import { createFileRoute } from "@tanstack/react-router";
import { Ban, Loader2, MessageSquare, Search, ShieldOff, UserPlus, UserX } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell, PageHeader } from "@/components/aura/app-shell";
import { EmptyState, ErrorState, LoadingState } from "@/components/aura/states";
import { UserAvatar } from "@/components/aura/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Contact, User } from "@/lib/api-types";
import { getApiErrorMessage } from "@/lib/axios";
import { chatService } from "@/services/chatService";
import { contactService } from "@/services/contactService";

export const Route = createFileRoute("/contacts")({
  head: () => ({
    meta: [
      { title: "Contacts — Nexora" },
      {
        name: "description",
        content: "Manage your Nexora contacts, search colleagues and control blocked users.",
      },
      { property: "og:title", content: "Contacts — Nexora" },
      { property: "og:description", content: "Manage contacts, search colleagues and blocked users." },
    ],
  }),
  component: () => (
    <AppShell>
      <ContactsPage />
    </AppShell>
  ),
});

function contactUser(contact: Contact): User | undefined {
  return contact.contact ?? contact.user;
}

function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [blocked, setBlocked] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, blockedList] = await Promise.all([contactService.list(), contactService.blocked()]);
      setContacts(list);
      setBlocked(blockedList);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load contacts"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(userId: string, action: () => Promise<unknown>, message: string) {
    setBusyId(userId);
    try {
      await action();
      toast.success(message);
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Action failed"));
    } finally {
      setBusyId(null);
    }
  }

  async function search(event: React.FormEvent) {
    event.preventDefault();
    if (!term.trim()) return;
    setSearching(true);
    try {
      setResults(await contactService.search(term.trim()));
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Search failed"));
    } finally {
      setSearching(false);
    }
  }

  return (
    <>
      <PageHeader title="Contacts" description="Search people, manage contacts and blocked users." />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">
        <Tabs defaultValue="contacts">
          <TabsList>
            <TabsTrigger value="contacts">My contacts</TabsTrigger>
            <TabsTrigger value="search">Find people</TabsTrigger>
            <TabsTrigger value="blocked">Blocked</TabsTrigger>
          </TabsList>

          <TabsContent value="contacts" className="mt-4 space-y-2">
            {loading && <LoadingState />}
            {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}
            {!loading && !error && contacts.length === 0 && (
              <EmptyState title="No contacts yet" description="Use “Find people” to add your first contact." />
            )}
            {!loading &&
              !error &&
              contacts.map((contact) => {
                const person = contactUser(contact);
                if (!person) return null;
                return (
                  <div
                    key={contact._id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3"
                  >
                    <UserAvatar name={person.name} src={person.avatar} online={person.isOnline} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{person.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        @{person.username} · {person.about ?? "No status"}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyId === person._id}
                      onClick={() =>
                        void runAction(person._id, () => chatService.createPrivate(person._id), "Chat ready")
                      }
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Chat
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyId === person._id}
                      onClick={() =>
                        void runAction(person._id, () => contactService.block(person._id), "Contact blocked")
                      }
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busyId === person._id}
                      onClick={() =>
                        void runAction(person._id, () => contactService.remove(person._id), "Contact removed")
                      }
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
          </TabsContent>

          <TabsContent value="search" className="mt-4 space-y-3">
            <form className="flex gap-2" onSubmit={search}>
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Search by name, username, email or phone"
                  className="pl-9"
                />
              </div>
              <Button type="submit" disabled={searching || !term.trim()}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
              </Button>
            </form>
            {results.length === 0 && !searching && (
              <EmptyState title="Search for colleagues" description="Results will appear here." />
            )}
            {results.map((person) => (
              <div
                key={person._id}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3"
              >
                <UserAvatar name={person.name} src={person.avatar} online={person.isOnline} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{person.name}</p>
                  <p className="truncate text-xs text-muted-foreground">@{person.username}</p>
                </div>
                <Button
                  size="sm"
                  disabled={busyId === person._id}
                  onClick={() =>
                    void runAction(person._id, () => contactService.add(person._id), "Contact added")
                  }
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="blocked" className="mt-4 space-y-2">
            {loading && <LoadingState />}
            {!loading && blocked.length === 0 && (
              <EmptyState title="No blocked users" description="Blocked contacts will be listed here." />
            )}
            {blocked.map((contact) => {
              const person = contactUser(contact);
              if (!person) return null;
              return (
                <div
                  key={contact._id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3"
                >
                  <UserAvatar name={person.name} src={person.avatar} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{person.name}</p>
                    <p className="truncate text-xs text-muted-foreground">@{person.username}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busyId === person._id}
                    onClick={() =>
                      void runAction(person._id, () => contactService.unblock(person._id), "Contact unblocked")
                    }
                  >
                    <ShieldOff className="mr-2 h-4 w-4" />
                    Unblock
                  </Button>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
