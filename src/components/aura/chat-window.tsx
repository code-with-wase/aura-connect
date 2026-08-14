import {
  ArrowLeft,
  Ban,
  BellOff,
  Bell,
  Check,
  CheckCheck,
  Download,
  Forward,
  Loader2,
  MoreVertical,
  Paperclip,
  Pencil,
  Phone,
  Pin,
  Reply,
  Send,
  SmilePlus,
  Star,
  Trash2,
  Users,
  Video,
  Wallpaper as WallpaperIcon,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { EmptyState, ErrorState, LoadingState } from "@/components/aura/states";
import { GroupInfoPanel, activeMembers, canSendToGroup } from "@/components/aura/group-info-panel";
import { UserAvatar } from "@/components/aura/user-avatar";
import { WallpaperPicker, useChatWallpaper } from "@/components/aura/wallpaper-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/context/auth-context";
import type { Chat, Group, Message, User } from "@/lib/api-types";
import { getApiErrorMessage } from "@/lib/axios";
import {
  chatAvatar,
  chatGroupId,
  chatMembers,
  chatTitle,
  formatTime,
  isGroupChat,
  isPresenceOnline,
  otherParticipant,
  presenceLabel,
  senderId,
  senderName,
} from "@/lib/chat-utils";
import { downloadFile, formatFileSize } from "@/lib/media";
import { usePresence } from "@/lib/presence-store";
import { getSocket } from "@/lib/socket";
import { cn } from "@/lib/utils";
import { callService } from "@/services/callService";
import { chatService } from "@/services/chatService";
import { contactService } from "@/services/contactService";
import { groupService } from "@/services/groupService";
import { messageService } from "@/services/messageService";
import { uploadService } from "@/services/uploadService";
import { userService } from "@/services/userService";

const REACTIONS = ["👍", "❤️", "😂", "🎉", "🙏"];
const POLL_MS = 6000;

/** Single check = sent, double = delivered, blue double = read. */
function MessageTicks({ message }: { message: Message }) {
  const status =
    message.status ?? (message.readAt ? "read" : message.deliveredAt ? "delivered" : "sent");
  if (status === "sending") return <Loader2 className="h-3 w-3 animate-spin" />;
  if (status === "read") return <CheckCheck className="h-3 w-3 text-accent" aria-label="Read" />;
  if (status === "delivered") return <CheckCheck className="h-3 w-3" aria-label="Delivered" />;
  return <Check className="h-3 w-3" aria-label="Sent" />;
}

function MessageAttachment({
  message,
  onPreview,
}: {
  message: Message;
  onPreview: (message: Message) => void;
}) {
  const attachment = message.attachment;
  if (!attachment?.url) return null;
  const fileName = attachment.fileName ?? "attachment";
  const size = formatFileSize(attachment.fileSize);

  if (message.type === "image") {
    return (
      <div className="mb-2 space-y-1">
        <button type="button" onClick={() => onPreview(message)} className="block w-full">
          <img
            src={attachment.url}
            alt={fileName}
            className="max-h-64 w-full rounded-md object-cover"
            loading="lazy"
          />
        </button>
        <button
          type="button"
          onClick={() => void downloadFile(attachment.url!, fileName)}
          className="inline-flex items-center gap-1 text-[11px] underline opacity-90"
        >
          <Download className="h-3 w-3" /> Download{size ? ` · ${size}` : ""}
        </button>
      </div>
    );
  }

  if (message.type === "video") {
    return (
      <div className="mb-2 space-y-1">
        <video
          src={attachment.url}
          controls
          preload="metadata"
          playsInline
          className="max-h-64 w-full rounded-md bg-black/40"
        />
        <button
          type="button"
          onClick={() => void downloadFile(attachment.url!, fileName)}
          className="inline-flex items-center gap-1 text-[11px] underline opacity-90"
        >
          <Download className="h-3 w-3" /> Download video{size ? ` · ${size}` : ""}
        </button>
      </div>
    );
  }

  if (message.type === "audio") {
    return (
      <div className="mb-2 space-y-1">
        <audio src={attachment.url} controls className="w-full" />
        <button
          type="button"
          onClick={() => void downloadFile(attachment.url!, fileName)}
          className="inline-flex items-center gap-1 text-[11px] underline opacity-90"
        >
          <Download className="h-3 w-3" /> Download audio
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void downloadFile(attachment.url!, fileName)}
      className="mb-1 flex w-full items-center gap-2 rounded-md border border-border/50 px-2 py-1.5 text-left text-xs"
    >
      <Download className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{fileName}</span>
      {size && <span className="shrink-0 opacity-70">{size}</span>}
    </button>
  );
}

function sortMessages(list: Message[]) {
  return [...list].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function ChatWindow({
  chat,
  chats,
  onBack,
  onChatsChanged,
}: {
  chat: Chat;
  chats: Chat[];
  onBack: () => void;
  onChatsChanged: () => void;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [wallpaperOpen, setWallpaperOpen] = useState(false);
  const { wallpaper } = useChatWallpaper(chat._id);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editing, setEditing] = useState<Message | null>(null);
  const [forwarding, setForwarding] = useState<Message | null>(null);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [partnerLive, setPartnerLive] = useState<User | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);
  const [preview, setPreview] = useState<Message | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const readRef = useRef<Set<string>>(new Set());
  /** Keeps parent callbacks out of effect deps so the chat never re-mounts/reloads. */
  const chatsChangedRef = useRef(onChatsChanged);
  chatsChangedRef.current = onChatsChanged;

  const isGroup = isGroupChat(chat);
  const groupId = chatGroupId(chat);
  const chatPartner = otherParticipant(chat, user?._id);
  const partner = usePresence(partnerLive ?? chatPartner ?? null);
  const memberCount = isGroup ? activeMembers(group).length || chatMembers(chat).length : 0;
  const canSend = !isGroup || canSendToGroup(group, user?._id);
  const mySettings = chat.settings?.find((s) => s.user === user?._id);
  const isMuted = mySettings?.isMuted ?? chat.isMuted ?? false;
  const isPinned = mySettings?.isPinned ?? chat.isPinned ?? false;

  /** Marks every incoming message as delivered + read so the sender gets blue ticks. */
  const acknowledge = useCallback(
    async (list: Message[]) => {
      const mineId = user?._id;
      if (!mineId) return;
      const pending = list.filter(
        (m) => senderId(m) !== mineId && m.status !== "read" && !readRef.current.has(m._id),
      );
      if (!pending.length) return;
      pending.forEach((m) => readRef.current.add(m._id));
      await Promise.allSettled(
        pending.map(async (m) => {
          await messageService.markDelivered(m._id).catch(() => undefined);
          await messageService.markRead(m._id).catch(() => undefined);
        }),
      );
      await chatService.markRead(chat._id).catch(() => undefined);
      setMessages((prev) =>
        prev.map((m) => (pending.some((p) => p._id === m._id) ? { ...m, status: "read" } : m)),
      );
      chatsChangedRef.current();
    },
    [chat._id, user?._id],
  );

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) setLoading(true);
      setError(null);
      try {
        const data = await messageService.listByChat(chat._id);
        const sorted = sortMessages(data);
        setMessages(sorted);
        void acknowledge(sorted);
      } catch (err) {
        setError(getApiErrorMessage(err, "Unable to load messages"));
      } finally {
        if (!options?.silent) setLoading(false);
      }
    },
    [chat._id, acknowledge],
  );

  useEffect(() => {
    readRef.current = new Set();
    void load();
    // Reload only when the conversation changes — not on every parent re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat._id]);

  /** Serverless backend => sockets are unreliable, so keep a light poll in sync. */
  useEffect(() => {
    const interval = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const data = sortMessages(await messageService.listByChat(chat._id));
        setMessages((prev) =>
          prev.length === data.length &&
          prev.every((m, i) => m._id === data[i]?._id && m.status === data[i]?.status)
            ? prev
            : data,
        );
        void acknowledge(data);
      } catch {
        /* keep last known messages; a transient poll failure is not an error state */
      }
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [chat._id, acknowledge]);

  /** Live presence for the other participant (REST heartbeat based). */
  useEffect(() => {
    if (isGroup || !chatPartner?._id) {
      setPartnerLive(null);
      return;
    }
    let cancelled = false;
    const fetchPartner = async () => {
      try {
        const fresh = await userService.byId(chatPartner._id);
        if (!cancelled) setPartnerLive(fresh);
      } catch {
        /* fall back to the participant embedded in the chat */
      }
    };
    void fetchPartner();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void fetchPartner();
    }, 15_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isGroup, chatPartner?._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  /** Group details (members, roles, permissions) for group chats. */
  const loadGroup = useCallback(async () => {
    if (!groupId) {
      setGroup(null);
      return;
    }
    try {
      setGroup(await groupService.byId(groupId));
    } catch {
      /* keep whatever the chat payload already carries */
    }
  }, [groupId]);

  useEffect(() => {
    void loadGroup();
  }, [loadGroup]);

  /** Group rooms + realtime membership/settings events. */
  useEffect(() => {
    if (!groupId) return;
    const socket = getSocket();
    if (!socket) return;
    socket.emit("group:join", { groupId });

    const refresh = () => {
      void loadGroup();
      chatsChangedRef.current();
    };
    const events = [
      "group:updated",
      "group:member-added",
      "group:member-removed",
      "group:member-left",
      "group:member-promoted",
      "group:member-demoted",
      "group:settings-updated",
    ];
    events.forEach((event) => socket.on(event, refresh));

    return () => {
      socket.emit("group:leave", { groupId });
      events.forEach((event) => socket.off(event, refresh));
    };
  }, [groupId, loadGroup]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("chat:join", { chatId: chat._id });

    const onMessage = (payload: { message?: Message } | Message) => {
      const message = (payload as { message?: Message }).message ?? (payload as Message);
      if (!message?._id || message.chat !== chat._id) return;
      setMessages((prev) => (prev.some((m) => m._id === message._id) ? prev : [...prev, message]));
      void acknowledge([message]);
      chatsChangedRef.current();
    };
    const onTyping = (payload: { chatId?: string; userId?: string; name?: string }) => {
      if (payload?.chatId !== chat._id || payload.userId === user?._id) return;
      setTypingUser(payload.name ?? "Someone");
      setTimeout(() => setTypingUser(null), 2500);
    };

    socket.on("message:new", onMessage);
    socket.on("message:received", onMessage);
    const silentRefresh = () => void load({ silent: true });
    socket.on("message:edited", silentRefresh);
    socket.on("message:deleted", silentRefresh);
    socket.on("reaction:added", silentRefresh);
    socket.on("reaction:removed", silentRefresh);
    socket.on("typing:start", onTyping);
    socket.on("typing:stop", () => setTypingUser(null));

    return () => {
      socket.emit("chat:leave", { chatId: chat._id });
      socket.off("message:new", onMessage);
      socket.off("message:received", onMessage);
      socket.off("message:edited", silentRefresh);
      socket.off("message:deleted", silentRefresh);
      socket.off("reaction:added", silentRefresh);
      socket.off("reaction:removed", silentRefresh);
      socket.off("typing:start", onTyping);
      socket.off("typing:stop");
    };
  }, [chat._id, user?._id, acknowledge, load]);

  function emitTyping() {
    getSocket()?.emit("typing:start", { chatId: chat._id });
  }

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setSending(true);
    try {
      if (editing) {
        const updated = await messageService.edit(editing._id, content);
        setMessages((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
        setEditing(null);
        getSocket()?.emit("message:edited", {
          chatId: chat._id,
          messageId: updated._id,
          message: updated,
        });
        toast.success("Message updated");
      } else {
        const message = await messageService.send({
          chatId: chat._id,
          type: "text",
          content,
          replyTo: replyTo?._id ?? null,
        });
        setMessages((prev) => [...prev, message]);
        setReplyTo(null);
        getSocket()?.emit("message:send", { chatId: chat._id, message });
        onChatsChanged();
      }
      setDraft("");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Message not sent"));
    } finally {
      setSending(false);
      getSocket()?.emit("typing:stop", { chatId: chat._id });
    }
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const uploaded = await uploadService.single(file);
      const type = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
          ? "video"
          : file.type.startsWith("audio/")
            ? "audio"
            : "document";
      const message = await messageService.send({
        chatId: chat._id,
        type,
        content: draft.trim() || null,
        attachment: {
          url: uploaded.url,
          publicId: uploaded.publicId ?? null,
          mimeType: uploaded.mimeType ?? file.type,
          fileName: uploaded.fileName ?? file.name,
          fileSize: uploaded.fileSize ?? file.size,
        },
      });
      setMessages((prev) => [...prev, message]);
      setDraft("");
      toast.success("File sent");
      onChatsChanged();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Upload failed"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function react(message: Message, emoji: string) {
    try {
      const updated = await messageService.addReaction(message._id, emoji);
      setMessages((prev) => prev.map((m) => (m._id === message._id ? (updated ?? m) : m)));
      getSocket()?.emit("reaction:add", { chatId: chat._id, messageId: message._id, emoji });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Reaction failed"));
    }
  }

  async function removeReaction(message: Message) {
    try {
      await messageService.removeReaction(message._id);
      await load({ silent: true });
      getSocket()?.emit("reaction:remove", { chatId: chat._id, messageId: message._id });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not remove reaction"));
    }
  }

  async function toggleStar(message: Message) {
    const starred = message.starredBy?.includes(user?._id ?? "");
    try {
      if (starred) await messageService.unstar(message._id);
      else await messageService.star(message._id);
      setMessages((prev) =>
        prev.map((m) =>
          m._id === message._id
            ? {
                ...m,
                starredBy: starred
                  ? (m.starredBy ?? []).filter((id) => id !== user?._id)
                  : [...(m.starredBy ?? []), user?._id ?? ""],
              }
            : m,
        ),
      );
      toast.success(starred ? "Removed from starred" : "Message starred");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not update star"));
    }
  }

  async function deleteMessage(message: Message, forEveryone: boolean) {
    try {
      await messageService.remove(message._id, forEveryone);
      if (forEveryone) {
        getSocket()?.emit("message:deleted", { chatId: chat._id, messageId: message._id });
      }
      setMessages((prev) =>
        forEveryone
          ? prev.map((m) => (m._id === message._id ? { ...m, isDeleted: true, content: null } : m))
          : prev.filter((m) => m._id !== message._id),
      );
      toast.success("Message deleted");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Delete failed"));
    }
  }

  async function forwardMessage(targetChatId: string) {
    if (!forwarding) return;
    try {
      await messageService.forward(forwarding._id, targetChatId);
      toast.success("Message forwarded");
      setForwarding(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Forward failed"));
    }
  }

  async function startCall(type: "audio" | "video") {
    const participantIds = chatMembers(chat)
      .map((member) => member._id)
      .filter((id) => id && id !== user?._id);
    if (!participantIds.length) {
      toast.error("No participants available for a call");
      return;
    }
    try {
      const call = await callService.create({
        type,
        mode: isGroup ? "group" : "private",
        chatId: chat._id,
        participantIds,
      });
      await callService.ringing(call._id).catch(() => undefined);
      getSocket()?.emit("call:join", { callId: call._id, chatId: chat._id });
      toast.success(`${type === "video" ? "Video" : "Audio"} call started`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Call could not be started"));
    }
  }

  async function updateChatSetting(payload: {
    isMuted?: boolean;
    isPinned?: boolean;
    isArchived?: boolean;
  }) {
    try {
      await chatService.updateSettings(chat._id, payload);
      toast.success("Conversation updated");
      onChatsChanged();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Update failed"));
    }
  }

  const title = useMemo(
    () => (isGroup ? (group?.name ?? chatTitle(chat, user?._id)) : chatTitle(chat, user?._id)),
    [chat, group?.name, isGroup, user?._id],
  );

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border bg-surface px-3 py-3 md:px-5">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onBack}
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          onClick={() => isGroup && setGroupInfoOpen(true)}
          aria-label={isGroup ? "Open group info" : title}
        >
          <UserAvatar
            name={title}
            src={
              isGroup ? (group?.avatar ?? chatAvatar(chat, user?._id)) : (partner?.avatar ?? null)
            }
            online={!isGroup && isPresenceOnline(partner)}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {typingUser
                ? `${typingUser} is typing…`
                : isGroup
                  ? `${memberCount} members`
                  : presenceLabel(partner)}
            </p>
          </div>
        </button>
        {isGroup && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setGroupInfoOpen(true)}
            aria-label="Group info"
          >
            <Users className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void startCall("audio")}
          aria-label="Audio call"
        >
          <Phone className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void startCall("video")}
          aria-label="Video call"
        >
          <Video className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Conversation options">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => void updateChatSetting({ isMuted: !isMuted })}>
              {isMuted ? <Bell className="mr-2 h-4 w-4" /> : <BellOff className="mr-2 h-4 w-4" />}
              {isMuted ? "Unmute" : "Mute"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void updateChatSetting({ isPinned: !isPinned })}>
              <Pin className="mr-2 h-4 w-4" />
              {isPinned ? "Unpin" : "Pin"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setWallpaperOpen(true)}>
              <WallpaperIcon className="mr-2 h-4 w-4" />
              Change wallpaper
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void updateChatSetting({ isArchived: true })}>
              Archive conversation
            </DropdownMenuItem>
            {!isGroup && partner && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      await contactService.block(partner._id);
                      toast.success(`${partner.name} blocked`);
                    } catch (err) {
                      toast.error(getApiErrorMessage(err, "Block failed"));
                    }
                  }}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Block contact
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={async () => {
                try {
                  await chatService.leave(chat._id);
                  toast.success("Left conversation");
                  onBack();
                  onChatsChanged();
                } catch (err) {
                  toast.error(getApiErrorMessage(err, "Could not leave chat"));
                }
              }}
            >
              Leave conversation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <WallpaperPicker open={wallpaperOpen} onOpenChange={setWallpaperOpen} chatId={chat._id} />

      {isGroup && group && (
        <GroupInfoPanel
          group={group}
          open={groupInfoOpen}
          onOpenChange={setGroupInfoOpen}
          currentUserId={user?._id}
          onChanged={() => {
            void loadGroup();
            chatsChangedRef.current();
          }}
          onLeft={() => {
            onBack();
            chatsChangedRef.current();
          }}
        />
      )}

      <ScrollArea className="min-h-0 flex-1" style={wallpaper.style}>
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-3 py-5 md:px-6">
          {loading && <LoadingState label="Loading messages…" />}
          {!loading && error && <ErrorState message={error} onRetry={() => void load()} />}
          {!loading && !error && messages.length === 0 && (
            <EmptyState
              title="No messages yet"
              description="Send the first message to start this conversation."
            />
          )}
          {!loading &&
            !error &&
            messages.map((message) => {
              const mine = senderId(message) === user?._id;
              const starred = message.starredBy?.includes(user?._id ?? "");
              const reply = typeof message.replyTo === "object" ? message.replyTo : null;
              return (
                <div
                  key={message._id}
                  className={cn("group flex gap-2", mine ? "justify-end" : "justify-start")}
                >
                  {!mine && isGroup && (
                    <UserAvatar
                      name={senderName(message)}
                      src={typeof message.sender === "object" ? message.sender.avatar : null}
                      size={28}
                    />
                  )}
                  <div className={cn("max-w-[80%] space-y-1", mine && "items-end text-right")}>
                    {!mine && isGroup && (
                      <p className="text-xs font-medium text-muted-foreground">
                        {senderName(message)}
                      </p>
                    )}
                    <div
                      className={cn(
                        "rounded-lg px-3 py-2 text-left text-sm shadow-sm",
                        mine ? "au-bubble-out" : "au-bubble-in",
                      )}
                    >
                      {reply && (
                        <div className="mb-1 border-l-2 border-border/60 pl-2 text-xs opacity-80">
                          {reply.content ?? reply.type}
                        </div>
                      )}
                      {message.isDeleted ? (
                        <span className="italic opacity-70">This message was deleted</span>
                      ) : (
                        <>
                          {message.attachment?.url && (
                            <MessageAttachment message={message} onPreview={setPreview} />
                          )}
                          {message.content && (
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          )}
                        </>
                      )}
                      <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70">
                        {message.isForwarded && <Forward className="h-3 w-3" />}
                        {message.isEdited && <span>edited</span>}
                        {starred && <Star className="h-3 w-3" />}
                        <span>{formatTime(message.createdAt)}</span>
                        {mine && <MessageTicks message={message} />}
                      </div>
                    </div>

                    {(message.reactions?.length ?? 0) > 0 && (
                      <button
                        type="button"
                        onClick={() => void removeReaction(message)}
                        className="rounded-full border border-border bg-surface px-2 py-0.5 text-xs"
                      >
                        {message.reactions?.map((r) => r.emoji).join(" ")}{" "}
                        {message.reactions?.length}
                      </button>
                    )}

                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            aria-label="React"
                          >
                            <SmilePlus className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align={mine ? "end" : "start"}
                          className="flex gap-1 p-1"
                        >
                          {REACTIONS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              className="rounded px-1.5 py-1 hover:bg-surface-hover"
                              onClick={() => void react(message, emoji)}
                            >
                              {emoji}
                            </button>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setReplyTo(message)}
                        aria-label="Reply"
                      >
                        <Reply className="h-3.5 w-3.5" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            aria-label="More actions"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={mine ? "end" : "start"}>
                          <DropdownMenuItem onClick={() => void toggleStar(message)}>
                            <Star className="mr-2 h-4 w-4" />
                            {starred ? "Unstar" : "Star"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setForwarding(message)}>
                            <Forward className="mr-2 h-4 w-4" />
                            Forward
                          </DropdownMenuItem>
                          {mine && !message.isDeleted && message.type === "text" && (
                            <DropdownMenuItem
                              onClick={() => {
                                setEditing(message);
                                setDraft(message.content ?? "");
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => void deleteMessage(message, false)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete for me
                          </DropdownMenuItem>
                          {mine && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => void deleteMessage(message, true)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete for everyone
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSend} className="border-t border-border bg-surface px-3 py-3 md:px-5">
        {(replyTo || editing) && (
          <div className="mb-2 flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
            <span className="truncate">
              {editing ? "Editing message" : `Replying to: ${replyTo?.content ?? replyTo?.type}`}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => {
                setReplyTo(null);
                setEditing(null);
                setDraft("");
              }}
              aria-label="Cancel"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        {!canSend && (
          <p className="mb-2 rounded-md border border-border bg-background px-3 py-2 text-center text-xs text-muted-foreground">
            Only admins can send messages in this group.
          </p>
        )}
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={uploading || !canSend}
            onClick={() => fileRef.current?.click()}
            aria-label="Attach file"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
          </Button>
          <Input
            value={draft}
            disabled={!canSend}
            onChange={(e) => {
              setDraft(e.target.value);
              emitTyping();
            }}
            placeholder={canSend ? "Write a message" : "Messaging restricted to admins"}
            aria-label="Message"
          />
          <Button type="submit" disabled={sending || !draft.trim() || !canSend}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </form>

      <Dialog open={Boolean(forwarding)} onOpenChange={(open) => !open && setForwarding(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Forward message</DialogTitle>
            <DialogDescription>Select a conversation to forward this message to.</DialogDescription>
          </DialogHeader>
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {chats
              .filter((item) => item._id !== chat._id)
              .map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => void forwardMessage(item._id)}
                  className="flex w-full items-center gap-3 rounded-md border border-transparent px-3 py-2 text-left text-sm hover:border-border hover:bg-surface-hover"
                >
                  <UserAvatar
                    name={chatTitle(item, user?._id)}
                    src={chatAvatar(item, user?._id)}
                    size={32}
                  />
                  {chatTitle(item, user?._id)}
                </button>
              ))}
            {chats.length <= 1 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No other conversations available.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setForwarding(null)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate">
              {preview?.attachment?.fileName ?? "Attachment"}
            </DialogTitle>
            <DialogDescription>{formatTime(preview?.createdAt)}</DialogDescription>
          </DialogHeader>
          {preview?.attachment?.url && (
            <img
              src={preview.attachment.url}
              alt={preview.attachment.fileName ?? "Attachment"}
              className="max-h-[70vh] w-full rounded-md object-contain"
            />
          )}
          <DialogFooter>
            <Button
              onClick={() =>
                preview?.attachment?.url &&
                void downloadFile(preview.attachment.url, preview.attachment.fileName)
              }
            >
              <Download className="mr-2 h-4 w-4" />
              Download original
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
