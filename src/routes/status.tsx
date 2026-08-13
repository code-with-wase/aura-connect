import { createFileRoute } from "@tanstack/react-router";
import { Eye, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Status } from "@/lib/api-types";
import { getApiErrorMessage } from "@/lib/axios";
import { formatDateTime } from "@/lib/chat-utils";
import { statusService } from "@/services/statusService";
import { uploadService } from "@/services/uploadService";

export const Route = createFileRoute("/status")({
  head: () => ({
    meta: [
      { title: "Status — Nexora" },
      {
        name: "description",
        content: "Post text or media status updates on Nexora and see who viewed them.",
      },
      { property: "og:title", content: "Status — Nexora" },
      { property: "og:description", content: "Post status updates and track views across your team." },
    ],
  }),
  component: () => (
    <AppShell>
      <StatusPage />
    </AppShell>
  ),
});

function StatusPage() {
  const [feed, setFeed] = useState<Status[]>([]);
  const [mine, setMine] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Status | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [feedList, myList] = await Promise.all([statusService.feed(), statusService.mine()]);
      setFeed(feedList);
      setMine(myList);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load status updates"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function openStatus(status: Status) {
    setViewing(status);
    try {
      await statusService.view(status._id);
    } catch {
      /* viewing own status returns an error, ignore */
    }
  }

  async function removeStatus(statusId: string) {
    try {
      await statusService.remove(statusId);
      toast.success("Status deleted");
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not delete status"));
    }
  }

  return (
    <>
      <PageHeader
        title="Status"
        description="Share short updates that disappear after 24 hours."
        action={<CreateStatusDialog onCreated={() => void load()} />}
      />
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5 md:px-6">
        {loading && <LoadingState />}
        {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}

        {!loading && !error && (
          <>
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-foreground">My updates</h2>
              {mine.length === 0 ? (
                <EmptyState title="No updates yet" description="Post your first status update." />
              ) : (
                mine.map((status) => (
                  <article
                    key={status._id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground">{status.content ?? status.type}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(status.createdAt)}</p>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="h-3.5 w-3.5" />
                      {status.viewsCount ?? status.views?.length ?? 0}
                    </span>
                    <Button variant="ghost" size="icon" aria-label="Delete status" onClick={() => void removeStatus(status._id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </article>
                ))
              )}
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-foreground">Recent updates</h2>
              {feed.length === 0 ? (
                <EmptyState title="No recent updates" description="Updates from your contacts appear here." />
              ) : (
                feed.map((status) => (
                  <button
                    key={status._id}
                    type="button"
                    onClick={() => void openStatus(status)}
                    className="flex w-full items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-left hover:bg-surface-hover"
                  >
                    <UserAvatar name={status.user?.name} src={status.user?.avatar} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {status.user?.name ?? "Member"}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {status.content ?? status.type} · {formatDateTime(status.createdAt)}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </section>
          </>
        )}
      </div>

      <Dialog open={Boolean(viewing)} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewing?.user?.name ?? "Status"}</DialogTitle>
            <DialogDescription>{formatDateTime(viewing?.createdAt)}</DialogDescription>
          </DialogHeader>
          {viewing?.media?.url && (
            <img src={viewing.media.url} alt="Status media" className="max-h-80 w-full rounded-md object-cover" />
          )}
          {viewing?.content && <p className="text-sm text-foreground">{viewing.content}</p>}
        </DialogContent>
      </Dialog>
    </>
  );
}

function CreateStatusDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [media, setMedia] = useState<{ url: string; publicId?: string | null; mimeType?: string | null } | null>(
    null,
  );
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setBusy(true);
    try {
      const uploaded = await uploadService.single(file);
      setMedia({ url: uploaded.url, publicId: uploaded.publicId ?? null, mimeType: uploaded.mimeType ?? file.type });
      toast.success("Media attached");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Upload failed"));
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const type = media ? (media.mimeType?.startsWith("video/") ? "video" : "image") : "text";
      await statusService.create({ type, content: content.trim() || null, media });
      toast.success("Status posted");
      setOpen(false);
      setContent("");
      setMedia(null);
      onCreated();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not post status"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New status
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New status</DialogTitle>
          <DialogDescription>Share a text update or attach an image or video.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="status-content">Message</Label>
            <Textarea
              id="status-content"
              maxLength={700}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening?"
            />
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
            }}
          />
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => fileRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              {media ? "Replace media" : "Attach media"}
            </Button>
            {media && <span className="truncate text-xs text-muted-foreground">Media attached</span>}
          </div>
          <Button type="submit" className="w-full" disabled={busy || (!content.trim() && !media)}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post status
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
