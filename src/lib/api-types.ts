export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type Privacy = "everyone" | "contacts" | "nobody";

export type User = {
  _id: string;
  name: string;
  username: string;
  email?: string;
  phone?: string;
  about?: string;
  avatar?: string | null;
  isOnline?: boolean;
  lastSeen?: string | null;
  privacy?: {
    lastSeen?: Privacy;
    profilePhoto?: Privacy;
    about?: Privacy;
    readReceipts?: boolean;
  };
};

export type Attachment = {
  url?: string;
  publicId?: string | null;
  mimeType?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
} | null;

export type Reaction = { user: string | User; emoji: string; createdAt?: string };

export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed";

export type Message = {
  _id: string;
  chat: string;
  sender: User | string;
  type: "text" | "image" | "video" | "audio" | "document" | "location" | "contact";
  content?: string | null;
  attachment?: Attachment;
  replyTo?: Message | string | null;
  reactions?: Reaction[];
  starredBy?: string[];
  isForwarded?: boolean;
  isEdited?: boolean;
  isDeleted?: boolean;
  status?: MessageStatus;
  deliveredAt?: string | null;
  readAt?: string | null;
  deliveredTo?: Array<{ user: string; deliveredAt?: string }>;
  readBy?: Array<{ user: string; readAt?: string }>;
  createdAt: string;
  updatedAt?: string;
};

/** Backend shape: chat.participants = [{ user, unreadCount, isMuted, ... }] */
export type ChatParticipant = {
  user: User | string;
  isAdmin?: boolean;
  isMuted?: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
  unreadCount?: number;
  leftAt?: string | null;
  lastReadAt?: string | null;
};

export type Chat = {
  _id: string;
  type?: "private" | "group";
  isGroup?: boolean;
  name?: string | null;
  avatar?: string | null;
  participants?: Array<ChatParticipant | User>;
  members?: Array<ChatParticipant | User>;
  group?: Group | string | null;
  lastMessage?: Message | null;
  unreadCount?: number;
  settings?: Array<{ user: string; isMuted?: boolean; isPinned?: boolean; isArchived?: boolean }>;
  isMuted?: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
  updatedAt?: string;
  createdAt?: string;
};

export type GroupMember = {
  user: User;
  role?: "admin" | "member";
  isAdmin?: boolean;
  joinedAt?: string;
};

export type Group = {
  _id: string;
  name: string;
  description?: string | null;
  avatar?: string | null;
  chat?: string | Chat;
  createdBy?: User | string;
  members?: GroupMember[];
  settings?: {
    onlyAdminsCanSendMessages?: boolean;
    onlyAdminsCanEditInfo?: boolean;
    onlyAdminsCanAddMembers?: boolean;
    onlyAdminsCanRemoveMembers?: boolean;
  };
  createdAt?: string;
};

export type Contact = {
  _id: string;
  user?: User;
  contact?: User;
  isBlocked?: boolean;
  createdAt?: string;
};

export type Status = {
  _id: string;
  user: User;
  type: "text" | "image" | "video";
  content?: string | null;
  media?: { url?: string; thumbnail?: string | null } | null;
  backgroundColor?: string | null;
  views?: Array<{ user: User | string; viewedAt?: string }>;
  viewers?: Array<{ user: User | string; viewedAt?: string }>;
  viewsCount?: number;
  createdAt: string;
  expiresAt?: string;
};

export type Call = {
  _id: string;
  type: "audio" | "video";
  mode?: "private" | "group";
  chat?: string | Chat;
  caller?: User | string;
  initiator?: User | string;
  participants?: Array<{ user: User | string; status?: string }>;
  status?: string;
  startedAt?: string;
  endedAt?: string;
  duration?: number;
  createdAt: string;
};

export type Notification = {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead?: boolean;
  chat?: string | null;
  createdAt: string;
};

export type UploadedFile = {
  url: string;
  publicId?: string;
  mimeType?: string;
  fileName?: string;
  fileSize?: number;
};
