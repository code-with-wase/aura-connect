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
      transports: ["websocket"],
      autoConnect: true,
      reconnectionAttempts: 5,
    });
    socket.on("connect", () => socket?.emit("presence:online"));
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
