import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BellOff,
  Loader2,
  LogOut,
  Plus,
  Settings2,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell, PageHeader } from "@/components/aura/app-shell";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import type { Group, User } from "@/lib/api-types";
import { getApiErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { groupService } from "@/services/groupService";
import { userService } from "@/services/userService";

export const Route = createFileRoute("/groups")({
  head: () => ({
    meta: [
      { title: "Groups — Aura Connect" },
      {
        name: "description",
        content: "Create groups, manage members, admins, permissions and notifications on Aura Connect.",
      },
      { property: "og:title", content: "Groups — Aura Connect" },
      { property: "og:description", content: "Create groups and manage members, admins and permissions." },
    ],
  }),
  component: () => (
    <AppShell>
      <GroupsPage />
    </AppShell>
  ),
});

function isAdmin(group: Group, userId?: string) {
  return Boolean(
    group.members?.some(
      (member) => member.user?._id === userId && (member.role === "admin" || member.isAdmin),
    ),
  );
}

function GroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Group | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await groupService.list();
      setGroups(list);
      setSelected((prev) => (prev ? (list.find((g) => g._id === prev._id) ?? null) : null));
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load groups"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(action: () => Promise<unknown>, message: string) {
    setBusy(true);
    try {
      await action();
      toast.success(message);
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Action failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Groups"
        description="Create groups and manage members, admins and permissions."
        action={<CreateGroupDialog onCreated={() => void load()} />}
      />
      <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto px-4 py-5 md:grid-cols-[320px_1fr] md:px-6">
        <div className="space-y-2">
          {loading && <LoadingState />}
          {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}
          {!loading && !error && groups.length === 0 && (
            <EmptyState title="No groups yet" description="Create a group to collaborate with your team." />
          )}
          {!loading &&
            !error &&
            groups.map((group) => (
              <button
                key={group._id}
                type="button"
                onClick={() => setSelected(group)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-left hover:bg-surface-hover",
                  selected?._id === group._id && "border-accent",
                )}
              >
                <UserAvatar name={group.name} src={group.avatar} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{group.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {group.members?.length ?? 0} members
                  </span>
                </span>
              </button>
            ))}
        </div>

        {selected ? (
          <GroupDetails
            group={selected}
            canManage={isAdmin(selected, user?._id)}
            busy={busy}
            currentUserId={user?._id}
            onRun={run}
          />
        ) : (
          <div className="hidden items-center justify-center rounded-lg border border-dashed border-border md:flex">
            <p className="text-sm text-muted-foreground">Select a group to manage it.</p>
          </div>
        )}
      </div>
    </>
  );
}

function GroupDetails({
  group,
  canManage,
  busy,
  currentUserId,
  onRun,
}: {
  group: Group;
  canManage: boolean;
  busy: boolean;
  currentUserId?: string | undefined;
  onRun: (action: () => Promise<unknown>, message: string) => Promise<void>;
}) {
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description ?? "");
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setName(group.name);
    setDescription(group.description ?? "");
  }, [group._id, group.name, group.description]);

  const settings = group.settings ?? {};

  return (
    <div className="space-y-4 rounded-lg border border-border bg-surface p-4 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <UserAvatar name={group.name} src={group.avatar} size={48} />
          <div>
            <h2 className="text-base font-semibold text-foreground">{group.name}</h2>
            <p className="text-sm text-muted-foreground">{group.description || "No description"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => {
              const next = !muted;
              setMuted(next);
              void onRun(() => groupService.mute(group._id, next), next ? "Group muted" : "Group unmuted");
            }}
          >
            <BellOff className="mr-2 h-4 w-4" />
            {muted ? "Unmute" : "Mute"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => void onRun(() => groupService.leave(group._id), "Left group")}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Leave
          </Button>
        </div>
      </div>

      {canManage && (
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            void onRun(
              () => groupService.update(group._id, { name, description: description || null }),
              "Group updated",
            );
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="group-name">Group name</Label>
            <Input id="group-name" value={name} minLength={2} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="group-description">Description</Label>
            <Input
              id="group-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" size="sm" disabled={busy}>
              Save changes
            </Button>
          </div>
        </form>
      )}

      {canManage && (
        <section className="space-y-3 rounded-md border border-border p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Settings2 className="h-4 w-4" />
            Group permissions
          </h3>
          {(
            [
              ["onlyAdminsCanSendMessages", "Only admins can send messages"],
              ["onlyAdminsCanEditInfo", "Only admins can edit group info"],
              ["onlyAdminsCanAddMembers", "Only admins can add members"],
              ["onlyAdminsCanRemoveMembers", "Only admins can remove members"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <Label htmlFor={key} className="text-sm font-normal text-muted-foreground">
                {label}
              </Label>
              <Switch
                id={key}
                checked={Boolean(settings[key])}
                disabled={busy}
                onCheckedChange={(checked) =>
                  void onRun(
                    () => groupService.updateSettings(group._id, { [key]: checked }),
                    "Permissions updated",
                  )
                }
              />
            </div>
          ))}
        </section>
      )}

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Members ({group.members?.length ?? 0})</h3>
          {canManage && <AddMembersDialog groupId={group._id} onDone={onRun} busy={busy} />}
        </div>
        {(group.members ?? []).map((member) => {
          const admin = member.role === "admin" || member.isAdmin;
          return (
            <div
              key={member.user?._id}
              className="flex items-center gap-3 rounded-md border border-border px-3 py-2"
            >
              <UserAvatar name={member.user?.name} src={member.user?.avatar} size={32} online={member.user?.isOnline} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {member.user?.name}
                  {member.user?._id === currentUserId && " (you)"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  @{member.user?.username} · {admin ? "Admin" : "Member"}
                </p>
              </div>
              {canManage && member.user?._id !== currentUserId && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={busy}
                    aria-label={admin ? "Demote member" : "Promote member"}
                    onClick={() =>
                      void onRun(
                        () =>
                          admin
                            ? groupService.demote(group._id, member.user!._id)
                            : groupService.promote(group._id, member.user!._id),
                        admin ? "Member demoted" : "Member promoted",
                      )
                    }
                  >
                    {admin ? (
                      <ArrowDownCircle className="h-4 w-4" />
                    ) : (
                      <ArrowUpCircle className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={busy}
                    aria-label="Remove member"
                    onClick={() =>
                      void onRun(
                        () => groupService.removeMember(group._id, member.user!._id),
                        "Member removed",
                      )
                    }
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}

function AddMembersDialog({
  groupId,
  busy,
  onDone,
}: {
  groupId: string;
  busy: boolean;
  onDone: (action: () => Promise<unknown>, message: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Add members
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add members</DialogTitle>
          <DialogDescription>Search people and add them to this group.</DialogDescription>
        </DialogHeader>
        <form className="flex gap-2" onSubmit={search}>
          <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search people" />
          <Button type="submit" disabled={searching || !term.trim()}>
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
        </form>
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {results.map((person) => (
            <div key={person._id} className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
              <UserAvatar name={person.name} src={person.avatar} size={32} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{person.name}</p>
                <p className="truncate text-xs text-muted-foreground">@{person.username}</p>
              </div>
              <Button
                size="sm"
                disabled={busy}
                onClick={async () => {
                  await onDone(() => groupService.addMembers(groupId, [person._id]), "Member added");
                  setOpen(false);
                }}
              >
                Add
              </Button>
            </div>
          ))}
          {results.length === 0 && !searching && (
            <p className="py-6 text-center text-sm text-muted-foreground">No results yet.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateGroupDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [selected, setSelected] = useState<User[]>([]);
  const [busy, setBusy] = useState(false);

  async function search(event: React.FormEvent) {
    event.preventDefault();
    if (!term.trim()) return;
    try {
      setResults(await userService.search(term.trim()));
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Search failed"));
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await groupService.create({
        name: name.trim(),
        description: description.trim() || null,
        memberIds: selected.map((person) => person._id),
      });
      toast.success("Group created");
      setOpen(false);
      setName("");
      setDescription("");
      setSelected([]);
      setResults([]);
      onCreated();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not create group"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New group
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create group</DialogTitle>
          <DialogDescription>Name your group and invite the first members.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="new-group-name">Group name</Label>
            <Input
              id="new-group-name"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-group-description">Description</Label>
            <Textarea
              id="new-group-description"
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Members</Label>
            <div className="flex gap-2">
              <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search people" />
              <Button type="button" variant="outline" onClick={search}>
                Search
              </Button>
            </div>
            {selected.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Selected: {selected.map((person) => person.name).join(", ")}
              </p>
            )}
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {results.map((person) => (
                <button
                  key={person._id}
                  type="button"
                  onClick={() =>
                    setSelected((prev) =>
                      prev.some((p) => p._id === person._id)
                        ? prev.filter((p) => p._id !== person._id)
                        : [...prev, person],
                    )
                  }
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md border border-border px-3 py-2 text-left text-sm",
                    selected.some((p) => p._id === person._id) && "border-accent",
                  )}
                >
                  <UserAvatar name={person.name} src={person.avatar} size={28} />
                  {person.name}
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={busy || name.trim().length < 2}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create group
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
