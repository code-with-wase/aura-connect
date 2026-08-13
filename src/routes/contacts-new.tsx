import { createFileRoute } from "@tanstack/react-router";
import { Ban, Lock, Loader2, MessageSquare, Search, ShieldOff, UserPlus, UserX } from "lucide-react";
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
import { contactService, type SearchResult } from "@/services/contactService";
import { deviceContactsService, type PermissionStatus } from "@/services/deviceContactsService";

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
  // Existing states
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [blocked, setBlocked] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Device contacts states
  const [deviceResults, setDeviceResults] = useState<SearchResult[]>([]);
  const [deviceLoading, setDeviceLoading] = useState(false);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>("prompt");
  const [permissionRequested, setPermissionRequested] = useState(false);

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

  // Check and request device contact permissions on mount
  useEffect(() => {
    void (async () => {
      const status = await deviceContactsService.checkPermission();
      setPermissionStatus(status);
    })();
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function requestContactsPermission() {
    setPermissionRequested(true);
    const status = await deviceContactsService.requestPermission();
    setPermissionStatus(status);

    if (status === "granted") {
      await loadDeviceContacts();
    } else if (status === "denied" || status === "restricted") {
      setDeviceError("Permission denied. Enable contacts access in settings to use this feature.");
    }
  }

  async function loadDeviceContacts() {
    setDeviceLoading(true);
    setDeviceError(null);
    setDeviceResults([]);

    try {
      const phones = await deviceContactsService.getUniquePhoneNumbers();

      if (phones.length === 0) {
        setDeviceError("No phone contacts found. Add contacts to your device and try again.");
        setDeviceLoading(false);
        return;
      }

      // Match phone numbers with Aura users
      try {
        const matched = await contactService.matchPhoneNumbers(phones);
        setDeviceResults(matched);

        if (matched.length === 0) {
          setDeviceError(
            "No Aura contacts found. The people in your contacts list aren't on Aura yet. Invite them to join!",
          );
        }
      } catch (matchErr) {
        // If the backend endpoint doesn't exist, show helpful error
        console.error("Device contact matching failed:", matchErr);
        setDeviceError(
          "Unable to sync contacts. This feature requires server updates. Please try again later.",
        );
      }
    } catch (err) {
      setDeviceError(getApiErrorMessage(err, "Unable to load device contacts"));
    } finally {
      setDeviceLoading(false);
    }
  }

  async function runAction(userId: string, action: () => Promise<unknown>, message: string) {
    setBusyId(userId);
    try {
      await action();
      toast.success(message);
      await load();
      if (searched && term.trim()) {
        try {
          setResults(await contactService.search(term.trim()));
        } catch {
          /* keep previous results if the refresh fails */
        }
      }
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
      setSearched(true);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Search failed"));
    } finally {
      setSearching(false);
    }
  }

  function renderContactItem(person: User, isContact: boolean, isBlocked: boolean, isDeviceContact = false) {
    return (
      <div
        key={person._id}
        className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3"
      >
        <UserAvatar name={person.name} src={person.avatar} online={person.isOnline} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{person.name}</p>
          <p className="truncate text-xs text-muted-foreground">@{person.username}</p>
        </div>
        {isBlocked ? (
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
        ) : isContact ? (
          <Button
            variant="outline"
            size="sm"
            disabled={busyId === person._id}
            onClick={() => void runAction(person._id, () => chatService.createPrivate(person._id), "Chat ready")}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            {isDeviceContact ? "Message" : "Chat"}
          </Button>
        ) : (
          <Button
            size="sm"
            disabled={busyId === person._id}
            onClick={() => void runAction(person._id, () => contactService.add(person._id), "Contact added")}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Contacts" description="Search people, manage contacts and blocked users." />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">
        <Tabs defaultValue="contacts">
          <TabsList>
            <TabsTrigger value="contacts">My contacts</TabsTrigger>
            <TabsTrigger value="aura-contacts">Contacts on Aura</TabsTrigger>
            <TabsTrigger value="search">Find people</TabsTrigger>
            <TabsTrigger value="blocked">Blocked</TabsTrigger>
          </TabsList>

          <TabsContent value="contacts" className="mt-4 space-y-2">
            {loading && <LoadingState />}
            {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}
            {!loading && !error && contacts.length === 0 && (
              <EmptyState
                title="No contacts yet"
                description="Use "Contacts on Aura" or "Find people" to add your first contact."
              />
            )}
            {!loading &&
              !error &&
              contacts.map((contact) => {
                const person = contactUser(contact);
                if (!person) return null;
                return renderContactItem(person, true, contact.isBlocked ?? false);
              })}
          </TabsContent>

          <TabsContent value="aura-contacts" className="mt-4 space-y-3">
            {permissionStatus === "granted" && !permissionRequested ? (
              <Button onClick={() => void loadDeviceContacts()} disabled={deviceLoading} className="w-full">
                {deviceLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing Contacts…
                  </>
                ) : (
                  "Sync Device Contacts"
                )}
              </Button>
            ) : permissionStatus !== "granted" && !permissionRequested ? (
              <div className="rounded-lg border border-border bg-surface p-4 text-center">
                <Lock className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="mb-2 text-sm font-medium">Contacts Permission Required</p>
                <p className="mb-4 text-xs text-muted-foreground">
                  Allow Aura to access your device contacts to find friends already using Aura.
                </p>
                <Button onClick={() => void requestContactsPermission()} size="sm">
                  Grant Permission
                </Button>
              </div>
            ) : permissionStatus === "denied" || permissionStatus === "restricted" ? (
              <ErrorState
                message={
                  permissionStatus === "denied"
                    ? "Contacts permission denied. Please enable it in your device settings."
                    : "Contacts permission is restricted. Please check your device settings."
                }
                onRetry={() => void requestContactsPermission()}
              />
            ) : null}

            {deviceLoading && <LoadingState label="Syncing contacts…" />}
            {!deviceLoading && deviceError && (
              <ErrorState message={deviceError} onRetry={() => void loadDeviceContacts()} />
            )}
            {!deviceLoading &&
              !deviceError &&
              deviceResults.length === 0 &&
              permissionStatus === "granted" &&
              permissionRequested && (
                <EmptyState
                  title="No Aura contacts found"
                  description="None of your device contacts are on Aura yet. Invite them to join!"
                />
              )}
            {!deviceLoading &&
              !deviceError &&
              deviceResults.map(({ user: person, isContact, isBlocked }) =>
                renderContactItem(person, isContact, isBlocked, true),
              )}
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
            {searching && <LoadingState label="Searching…" />}
            {!searching && results.length === 0 && (
              <EmptyState
                title={searched ? "No people found" : "Search for colleagues"}
                description={
                  searched
                    ? "Try a different name, username, email or phone number."
                    : "Results will appear here."
                }
              />
            )}
            {!searching &&
              results.map(({ user: person, isContact, isBlocked }) =>
                renderContactItem(person, isContact, isBlocked),
              )}
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
