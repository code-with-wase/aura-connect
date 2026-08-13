import { io, type Socket } from "socket.io-client";

import { API_BASE_URL, tokenStore } from "./axios";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  const token = tokenStore.access;
  if (!token) return null;

  if (!socket) {
    socket = io(API_BASE_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnectionAttempts: 3,
      timeout: 8000,
    });
    socket.on("connect", () => socket?.emit("presence:online"));
    // The deployed backend runs on serverless functions, so realtime may be unavailable.
    socket.on("connect_error", () => undefined);
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.emit("presence:offline");
    socket.disconnect();
    socket = null;
  }
}
