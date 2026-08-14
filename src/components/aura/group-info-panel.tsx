import {
  ArrowDownCircle,
  ArrowUpCircle,
  Bell,
  BellOff,
  Loader2,
  LogOut,
  Settings2,
  ShieldCheck,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { UserAvatar } from "@/components/aura/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import type { Group, GroupMember, User } from "@/lib/api-types";
import { getApiErrorMessage } from "@/lib/axios";
import { groupService } from "@/services/groupService";
import { userService } from "@/services/userService";

const PERMISSIONS = [
  ["onlyAdminsCanSendMessages", "Only admins can send messages"],
  ["onlyAdminsCanEditInfo", "Only admins can edit group info"],
  ["onlyAdminsCanAddMembers", "Only admins can add members"],
  ["onlyAdminsCanRemoveMembers", "Only admins can remove members"],
] as const;

export function activeMembers(group?: Group | null): GroupMember[] {
  return (group?.members ?? []).filter((member) => Boolean(member?.user) && !member.leftAt);
}

export function isGroupAdmin(group?: Group | null, userId?: string) {
  return activeMembers(group).some(
    (member) => member.user?._id === userId && (member.role === "admin" || member.isAdmin),
  );
}

export function canSendToGroup(group?: Group | null, userId?: string) {
  if (!group) return true;
  if (!group.settings?.onlyAdminsCanSendMessages) return true;
  return isGroupAdmin(group, userId);
}

export function GroupInfoPanel({
  group,
  open,
  onOpenChange,
  currentUserId,
  onChanged,
  onLeft,
}: {
  group: Group;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId?: string | undefined;
  onChanged: () => void;
  onLeft?: () => void;
}) {
  const admin = isGroupAdmin(group, currentUserId);
  const members = activeMembers(group);
  const [busy, setBusy] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description ?? "");
  const [muted, setMuted] = useState(
    Boolean(members.find((member) => member.user?._id === currentUserId)?.isMuted),
  );

  useEffect(() => {
    setName(group.name);
    setDescription(group.description ?? "");
  }, [group._id, group.name, group.description]);

  async function run(action: () => Promise<unknown>, message: string) {
    setBusy(true);
    try {
      await action();
      toast.success(message);
      onChanged();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Action failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Group info</SheetTitle>
          <SheetDescription>Members, roles and permissions for this group.</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <UserAvatar name={group.name} src={group.avatar} size={72} />
            <div>
              <p className="text-base font-semibold text-foreground">{group.name}</p>
              <p className="text-sm text-muted-foreground">{members.length} members</p>
            </div>
            <p className="text-sm text-muted-foreground">{group.description || "No description"}</p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={busy}
              onClick={() => {
                const next = !muted;
                setMuted(next);
                void run(
                  () => groupService.mute(group._id, next),
                  next ? "Group muted" : "Group unmuted",
                );
              }}
            >
              {muted ? <Bell className="mr-2 h-4 w-4" /> : <BellOff className="mr-2 h-4 w-4" />}
              {muted ? "Unmute" : "Mute"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-destructive"
              disabled={busy}
              onClick={async () => {
                await run(() => groupService.leave(group._id), "You left the group");
                onOpenChange(false);
                onLeft?.();
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Leave
            </Button>
          </div>

          {admin && (
            <form
              className="space-y-3 rounded-lg border border-border p-3"
              onSubmit={(event) => {
                event.preventDefault();
                void run(
                  () => groupService.update(group._id, { name, description: description || null }),
                  "Group updated",
                );
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="gi-name">Group name</Label>
                <Input
                  id="gi-name"
                  value={name}
                  minLength={2}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gi-description">Description</Label>
                <Input
                  id="gi-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <Button type="submit" size="sm" disabled={busy}>
                Save changes
              </Button>
            </form>
          )}

          {admin && (
            <section className="space-y-3 rounded-lg border border-border p-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Settings2 className="h-4 w-4" />
                Group permissions
              </h3>
              {PERMISSIONS.map(([key, label]) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <Label
                    htmlFor={`gi-${key}`}
                    className="text-sm font-normal text-muted-foreground"
                  >
                    {label}
                  </Label>
                  <Switch
                    id={`gi-${key}`}
                    checked={Boolean(group.settings?.[key])}
                    disabled={busy}
                    onCheckedChange={(checked) =>
                      void run(
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
              <h3 className="text-sm font-semibold text-foreground">Members ({members.length})</h3>
              {admin && (
                <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              )}
            </div>
            {members.map((member) => {
              const memberAdmin = member.role === "admin" || member.isAdmin;
              return (
                <div
                  key={member.user._id}
                  className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
                >
                  <UserAvatar
                    name={member.user.name}
                    src={member.user.avatar}
                    size={36}
                    online={member.user.isOnline}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
                      {member.user.name}
                      {member.user._id === currentUserId && " (you)"}
                      {memberAdmin && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent/12 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                          <ShieldCheck className="h-3 w-3" /> Admin
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      @{member.user.username}
                    </p>
                  </div>
                  {admin && member.user._id !== currentUserId && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={busy}
                        aria-label={memberAdmin ? "Demote admin" : "Promote to admin"}
                        onClick={() =>
                          void run(
                            () =>
                              memberAdmin
                                ? groupService.demote(group._id, member.user._id)
                                : groupService.promote(group._id, member.user._id),
                            memberAdmin ? "Admin demoted" : "Member promoted",
                          )
                        }
                      >
                        {memberAdmin ? (
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
                          void run(
                            () => groupService.removeMember(group._id, member.user._id),
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

        <AddMembersDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          existingIds={members.map((member) => member.user._id)}
          busy={busy}
          onAdd={async (userId) => {
            await run(() => groupService.addMembers(group._id, [userId]), "Member added");
            setAddOpen(false);
          }}
        />
      </SheetContent>
    </Sheet>
  );
}

function AddMembersDialog({
  open,
  onOpenChange,
  existingIds,
  busy,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingIds: string[];
  busy: boolean;
  onAdd: (userId: string) => Promise<void>;
}) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  async function search(event: React.FormEvent) {
    event.preventDefault();
    if (!term.trim()) return;
    setSearching(true);
    try {
      const people = await userService.search(term.trim());
      setResults(people.filter((person) => !existingIds.includes(person._id)));
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Search failed"));
    } finally {
      setSearching(false);
      setSearched(true);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add members</DialogTitle>
          <DialogDescription>Search people and add them to this group.</DialogDescription>
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
              <UserAvatar name={person.name} src={person.avatar} size={32} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{person.name}</p>
                <p className="truncate text-xs text-muted-foreground">@{person.username}</p>
              </div>
              <Button size="sm" disabled={busy} onClick={() => void onAdd(person._id)}>
                Add
              </Button>
            </div>
          ))}
          {!searching && results.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {searched ? "No matching people found." : "Search to find people."}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
