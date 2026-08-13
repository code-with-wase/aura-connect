import type { Chat, Message, User } from "./api-types";

export function isGroupChat(chat: Chat) {
  return chat.isGroup === true || chat.type === "group" || Boolean(chat.group);
}

export function chatMembers(chat: Chat): User[] {
  return chat.participants ?? chat.members ?? [];
}

export function otherParticipant(chat: Chat, currentUserId?: string): User | undefined {
  return chatMembers(chat).find((member) => member?._id !== currentUserId);
}

export function chatTitle(chat: Chat, currentUserId?: string): string {
  if (isGroupChat(chat)) {
    const group = typeof chat.group === "object" && chat.group ? chat.group : null;
    return group?.name ?? chat.name ?? "Group";
  }
  return otherParticipant(chat, currentUserId)?.name ?? chat.name ?? "Conversation";
}

export function chatAvatar(chat: Chat, currentUserId?: string): string | null {
  if (isGroupChat(chat)) {
    const group = typeof chat.group === "object" && chat.group ? chat.group : null;
    return group?.avatar ?? chat.avatar ?? null;
  }
  return otherParticipant(chat, currentUserId)?.avatar ?? null;
}

export function senderId(message: Message): string {
  return typeof message.sender === "string" ? message.sender : message.sender?._id;
}

export function senderName(message: Message): string {
  return typeof message.sender === "string" ? "Member" : (message.sender?.name ?? "Member");
}

export function messagePreview(message?: Message | null): string {
  if (!message) return "No messages yet";
  if (message.isDeleted) return "This message was deleted";
  if (message.type !== "text") return message.type.charAt(0).toUpperCase() + message.type.slice(1);
  return message.content ?? "";
}

export function formatTime(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDuration(seconds?: number): string {
  if (!seconds || seconds < 1) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
}
