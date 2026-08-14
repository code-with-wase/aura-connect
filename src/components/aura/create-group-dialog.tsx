import { Loader2, Plus, Users } from "lucide-react";
import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import type { Group, User } from "@/lib/api-types";
import { getApiErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { groupService } from "@/services/groupService";
import { uploadService } from "@/services/uploadService";
import { userService } from "@/services/userService";

/** WhatsApp-style group creation: pick people, then name the group. */
export function CreateGroupDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (result: { group: Group; chatId: string | null }) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [selected, setSelected] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);

  function reset() {
    setName("");
    setDescription("");
    setAvatar(null);
    setTerm("");
    setResults([]);
    setSelected([]);
  }

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

  async function uploadAvatar(file: File) {
    setUploading(true);
    try {
      const uploaded = await uploadService.single(file);
      setAvatar(uploaded.url);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Avatar upload failed"));
    } finally {
      setUploading(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await groupService.create({
        name: name.trim(),
        description: description.trim() || null,
        avatar,
        memberIds: selected.map((person) => person._id),
      });
      toast.success("Group created");
      onCreated({ group: result.group, chatId: result.chatId });
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not create group"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" /> New group
          </DialogTitle>
          <DialogDescription>Name your group and add the first members.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="flex items-center gap-3">
            <UserAvatar name={name || "Group"} src={avatar} size={56} />
            <div className="space-y-1.5">
              <Label htmlFor="cg-avatar" className="text-xs text-muted-foreground">
                Group photo (optional)
              </Label>
              <input
                id="cg-avatar"
                type="file"
                accept="image/*"
                className="block w-full text-xs"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadAvatar(file);
                }}
              />
            </div>
            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cg-name">Group name</Label>
            <Input
              id="cg-name"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Design team"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cg-description">Description</Label>
            <Textarea
              id="cg-description"
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Members</Label>
            <div className="flex gap-2">
              <Input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search people"
              />
              <Button
                type="button"
                variant="outline"
                disabled={searching || !term.trim()}
                onClick={search}
              >
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
              </Button>
            </div>
            {selected.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Selected: {selected.map((person) => person.name).join(", ")}
              </p>
            )}
            <div className="max-h-44 space-y-1 overflow-y-auto">
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
                    selected.some((p) => p._id === person._id) && "border-accent bg-accent/8",
                  )}
                >
                  <UserAvatar name={person.name} src={person.avatar} size={28} />
                  <span className="min-w-0 flex-1 truncate">{person.name}</span>
                  <span className="truncate text-xs text-muted-foreground">@{person.username}</span>
                </button>
              ))}
              {!searching && results.length === 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  Search people to add them.
                </p>
              )}
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={busy || name.trim().length < 2}>
            {busy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Create group
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
