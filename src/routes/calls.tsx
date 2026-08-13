import { createFileRoute } from "@tanstack/react-router";
import { PhoneIncoming, PhoneMissed, PhoneOutgoing, Video } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AppShell, PageHeader } from "@/components/aura/app-shell";
import { EmptyState, ErrorState, LoadingState } from "@/components/aura/states";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import type { Call } from "@/lib/api-types";
import { getApiErrorMessage } from "@/lib/axios";
import { formatDateTime, formatDuration } from "@/lib/chat-utils";
import { callService } from "@/services/callService";

export const Route = createFileRoute("/calls")({
  head: () => ({
    meta: [
      { title: "Calls — Nexora" },
      {
        name: "description",
        content: "Review your Nexora audio and video call history with durations and outcomes.",
      },
      { property: "og:title", content: "Calls — Nexora" },
      { property: "og:description", content: "Audio and video call history with durations and outcomes." },
    ],
  }),
  component: () => (
    <AppShell>
      <CallsPage />
    </AppShell>
  ),
});

function CallsPage() {
  const { user } = useAuth();
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCalls(await callService.history());
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load call history"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <PageHeader
        title="Calls"
        description="Audio and video call history."
        action={
          <Button variant="outline" size="sm" onClick={() => void load()}>
            Refresh
          </Button>
        }
      />
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-5 md:px-6">
        {loading && <LoadingState />}
        {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}
        {!loading && !error && calls.length === 0 && (
          <EmptyState
            title="No calls yet"
            description="Start an audio or video call from any conversation header."
          />
        )}
        {!loading &&
          !error &&
          calls.map((call) => {
            const initiator = call.caller ?? call.initiator;
            const initiatorId = typeof initiator === "string" ? initiator : initiator?._id;
            const outgoing = initiatorId === user?._id;
            const missed = call.status === "missed" || call.status === "rejected";
            const name =
              typeof initiator === "object" && initiator ? initiator.name : outgoing ? "You" : "Unknown";
            return (
              <article
                key={call._id}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-md border border-border">
                  {call.type === "video" ? (
                    <Video className="h-4 w-4 text-muted-foreground" />
                  ) : missed ? (
                    <PhoneMissed className="h-4 w-4 text-destructive" />
                  ) : outgoing ? (
                    <PhoneOutgoing className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <PhoneIncoming className="h-4 w-4 text-muted-foreground" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground">
                    {call.type} · {call.status ?? "unknown"} · {formatDateTime(call.startedAt ?? call.createdAt)}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{formatDuration(call.duration)}</span>
              </article>
            );
          })}
      </div>
    </>
  );
}
