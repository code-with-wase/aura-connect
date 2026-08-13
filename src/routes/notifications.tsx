import { createFileRoute } from "@tanstack/react-router";
import { CheckCheck, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell, PageHeader } from "@/components/aura/app-shell";
import { EmptyState, ErrorState, LoadingState } from "@/components/aura/states";
import { Button } from "@/components/ui/button";
import type { Notification } from "@/lib/api-types";
import { getApiErrorMessage } from "@/lib/axios";
import { formatDateTime } from "@/lib/chat-utils";
import { getSocket } from "@/lib/socket";
import { cn } from "@/lib/utils";
import { notificationService } from "@/services/notificationService";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Aura Connect" },
      {
        name: "description",
        content: "Review and manage all Aura Connect notifications for messages, groups and calls.",
      },
      { property: "og:title", content: "Notifications — Aura Connect" },
      { property: "og:description", content: "Manage notifications for messages, groups and calls." },
    ],
  }),
  component: () => (
    <AppShell>
      <NotificationsPage />
    </AppShell>
  ),
});

function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await notificationService.list({ limit: 50 }));
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load notifications"));
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
    socket.on("notification:new", refresh);
    return () => {
      socket.off("notification:new", refresh);
    };
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
        title="Notifications"
        description="Everything that needs your attention."
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={busy || items.length === 0}
              onClick={() => void run(() => notificationService.markAllRead(), "All marked as read")}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={busy || items.length === 0}
              onClick={() => void run(() => notificationService.removeAll(), "Notifications cleared")}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear all
            </Button>
          </div>
        }
      />
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-5 md:px-6">
        {loading && <LoadingState />}
        {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}
        {!loading && !error && items.length === 0 && (
          <EmptyState title="You're all caught up" description="New notifications will appear here." />
        )}
        {!loading &&
          !error &&
          items.map((item) => (
            <article
              key={item._id}
              className={cn(
                "flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3",
                !item.isRead && "border-l-2 border-l-accent",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.type} · {formatDateTime(item.createdAt)}
                </p>
              </div>
              {!item.isRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => void run(() => notificationService.markRead(item._id), "Marked as read")}
                >
                  Read
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                disabled={busy}
                aria-label="Delete notification"
                onClick={() => void run(() => notificationService.remove(item._id), "Notification deleted")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </article>
          ))}
      </div>
    </>
  );
}
