import type { Chat, ChatParticipant, Message, User } from "./api-types";

export function isGroupChat(chat: Chat) {
  return chat.isGroup === true || chat.type === "group" || Boolean(chat.group);
}

function isUserObject(value: unknown): value is User {
  return Boolean(value && typeof value === "object" && "name" in (value as Record<string, unknown>));
}

/**
 * The API returns participants as `[{ user: User, unreadCount, ... }]`.
 * Older/other endpoints return plain users — normalise both shapes.
 */
export function chatMembers(chat: Chat): User[] {
  const raw = (chat.participants ?? chat.members ?? []) as Array<ChatParticipant | User>;
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      if ("user" in entry) return isUserObject(entry.user) ? entry.user : null;
      return isUserObject(entry) ? entry : null;
    })
    .filter((member): member is User => Boolean(member?._id));
}

function participantEntries(chat: Chat): ChatParticipant[] {
  const raw = (chat.participants ?? chat.members ?? []) as Array<ChatParticipant | User>;
  return raw.filter((entry): entry is ChatParticipant => Boolean(entry) && typeof entry === "object" && "user" in entry);
}

function participantId(entry: ChatParticipant): string | undefined {
  return typeof entry.user === "string" ? entry.user : entry.user?._id;
}

export function myParticipant(chat: Chat, currentUserId?: string): ChatParticipant | undefined {
  if (!currentUserId) return undefined;
  return participantEntries(chat).find((entry) => participantId(entry) === currentUserId);
}

export function chatUnreadCount(chat: Chat, currentUserId?: string): number {
  return myParticipant(chat, currentUserId)?.unreadCount ?? chat.unreadCount ?? 0;
}

export function otherParticipant(chat: Chat, currentUserId?: string): User | undefined {
  const members = chatMembers(chat);
  return members.find((member) => member._id !== currentUserId) ?? members[0];
}

export function chatTitle(chat: Chat, currentUserId?: string): string {
  if (isGroupChat(chat)) {
    const group = typeof chat.group === "object" && chat.group ? chat.group : null;
    return group?.name ?? chat.name ?? "Group";
  }
  const partner = otherParticipant(chat, currentUserId);
  return partner?.name ?? (partner?.username ? `@${partner.username}` : null) ?? chat.name ?? "Conversation";
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

/** WhatsApp-style presence label: "online", "last seen today at 10:20 AM", … */
export function presenceLabel(user?: Pick<User, "isOnline" | "lastSeen"> | null): string {
  if (!user) return "";
  if (user.isOnline) return "online";
  if (!user.lastSeen) return "last seen recently";
  const seen = new Date(user.lastSeen);
  if (Number.isNaN(seen.getTime())) return "last seen recently";
  const diff = Date.now() - seen.getTime();
  if (diff < 60_000) return "online";

  const time = seen.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (seen.toDateString() === today.toDateString()) return `last seen today at ${time}`;
  if (seen.toDateString() === yesterday.toDateString()) return `last seen yesterday at ${time}`;
  if (diff < 7 * 86_400_000) {
    const weekday = seen.toLocaleDateString(undefined, { weekday: "long" });
    return `last seen ${weekday} at ${time}`;
  }
  const date = seen.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
  return `last seen ${date} at ${time}`;
}

export function isPresenceOnline(user?: Pick<User, "isOnline" | "lastSeen"> | null): boolean {
  if (!user) return false;
  if (user.isOnline) return true;
  if (!user.lastSeen) return false;
  const seen = new Date(user.lastSeen).getTime();
  return !Number.isNaN(seen) && Date.now() - seen < 60_000;
}
