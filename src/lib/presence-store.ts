import { useEffect, useState } from "react";

import type { User } from "./api-types";
import { getSocket } from "./socket";

export type PresenceInfo = { isOnline: boolean; lastSeen: string | null };

const store = new Map<string, PresenceInfo>();
const listeners = new Set<() => void>();
let bound = false;

function notify() {
  listeners.forEach((listener) => listener());
}

/** Cache the backend `presence:updated` payloads so every screen stays in sync. */
export function applyPresence(userId: string, info: PresenceInfo) {
  if (!userId) return;
  const previous = store.get(userId);
  if (previous && previous.isOnline === info.isOnline && previous.lastSeen === info.lastSeen)
    return;
  store.set(userId, info);
  notify();
}

function bindSocket() {
  if (bound) return;
  const socket = getSocket();
  if (!socket) return;
  bound = true;
  socket.on(
    "presence:updated",
    (payload: { userId?: string; isOnline?: boolean; lastSeen?: string | null }) => {
      if (!payload?.userId) return;
      applyPresence(String(payload.userId), {
        isOnline: Boolean(payload.isOnline),
        lastSeen: payload.lastSeen ?? null,
      });
    },
  );
}

export function getPresence(userId?: string | null): PresenceInfo | undefined {
  return userId ? store.get(userId) : undefined;
}

/**
 * Returns the freshest presence for a user: live `presence:updated` socket data
 * when available, otherwise the `isOnline`/`lastSeen` fields from the API.
 */
export function usePresence<T extends Pick<User, "_id" | "isOnline" | "lastSeen">>(
  user?: T | null,
): T | null {
  const [, setVersion] = useState(0);

  useEffect(() => {
    bindSocket();
    const listener = () => setVersion((value) => value + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  if (!user) return null;
  const live = store.get(user._id);
  if (!live) return user;
  return { ...user, isOnline: live.isOnline, lastSeen: live.lastSeen };
}
