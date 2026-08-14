import { userService } from "@/services/userService";

/**
 * The deployed backend runs on serverless functions, where socket presence is
 * unreliable. Presence is therefore kept in sync with the REST endpoint
 * `PUT /user/status`, refreshed by a heartbeat while the tab/app is visible.
 */
const HEARTBEAT_MS = 25_000;

let timer: ReturnType<typeof setInterval> | null = null;
let started = false;

async function push(isOnline: boolean) {
  try {
    await userService.updateOnlineStatus(isOnline);
  } catch {
    /* presence is best-effort */
  }
}

function onVisibility() {
  void push(document.visibilityState === "visible");
}

function onOffline() {
  void push(false);
}

function onOnline() {
  void push(true);
}

export function startPresence() {
  if (typeof window === "undefined" || started) return;
  started = true;
  void push(true);
  timer = setInterval(() => {
    if (document.visibilityState === "visible" && navigator.onLine) void push(true);
  }, HEARTBEAT_MS);
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", onOffline);
  window.addEventListener("offline", onOffline);
  window.addEventListener("online", onOnline);
}

export function stopPresence(markOffline = true) {
  if (typeof window === "undefined" || !started) return;
  started = false;
  if (timer) clearInterval(timer);
  timer = null;
  document.removeEventListener("visibilitychange", onVisibility);
  window.removeEventListener("pagehide", onOffline);
  window.removeEventListener("offline", onOffline);
  window.removeEventListener("online", onOnline);
  if (markOffline) void push(false);
}
