export type Reaction = { emoji: string; count: number };

export type Message = {
  id: string;
  author: "me" | string;
  text: string;
  time: string;
  status?: "sent" | "delivered" | "read";
  reactions?: Reaction[];
  replyTo?: { author: string; text: string };
};

export type Conversation = {
  id: string;
  name: string;
  initials: string;
  accent: string;
  role: string;
  lastSeen: string;
  online: boolean;
  typing?: boolean;
  unread?: number;
  pinned?: boolean;
  kind: "direct" | "group";
  members?: { name: string; initials: string; admin?: boolean; role: string }[];
  preview: string;
  previewTime: string;
  messages: Message[];
};

export const me = {
  name: "Syed Abbuzar",
  username: "@abbuzar",
  initials: "SA",
  about: "Product designer. Building calm interfaces.",
  email: "abbuzar@nexora.app",
  phone: "+91 98••• ••210",
  location: "Kolkata, IN",
};

export const conversations: Conversation[] = [
  {
    id: "aria",
    name: "Aria Kapoor",
    initials: "AK",
    accent: "oklch(0.62 0.18 300)",
    role: "Design lead",
    lastSeen: "Active now",
    online: true,
    typing: true,
    unread: 2,
    pinned: true,
    kind: "direct",
    preview: "Sending the motion spec in a sec…",
    previewTime: "09:41",
    messages: [
      {
        id: "m1",
        author: "Aria Kapoor",
        text: "Morning! I reworked the composer — it floats now instead of sitting flat on the edge.",
        time: "09:31",
        reactions: [{ emoji: "🔥", count: 2 }],
      },
      {
        id: "m2",
        author: "me",
        text: "That's the one. It makes the whole chat feel lighter.",
        time: "09:33",
        status: "read",
      },
      {
        id: "m3",
        author: "Aria Kapoor",
        text: "Also tightened the bubble radius and dropped the heavy shadows.",
        time: "09:35",
      },
      {
        id: "m4",
        author: "me",
        text: "Perfect — subtle beats loud every time.",
        time: "09:36",
        status: "read",
        replyTo: { author: "Aria Kapoor", text: "Also tightened the bubble radius…" },
        reactions: [{ emoji: "💜", count: 1 }],
      },
      {
        id: "m5",
        author: "Aria Kapoor",
        text: "Sending the motion spec in a sec…",
        time: "09:41",
      },
    ],
  },
  {
    id: "orbit",
    name: "Orbit Product Team",
    initials: "OP",
    accent: "oklch(0.68 0.14 220)",
    role: "8 members",
    lastSeen: "5 online",
    online: true,
    unread: 5,
    pinned: true,
    kind: "group",
    members: [
      { name: "Aria Kapoor", initials: "AK", admin: true, role: "Design lead" },
      { name: "Noor Sheikh", initials: "NS", admin: true, role: "Engineering" },
      { name: "Dev Raman", initials: "DR", role: "Frontend" },
      { name: "Lina Costa", initials: "LC", role: "Research" },
      { name: "Syed Abbuzar", initials: "SA", role: "You" },
    ],
    preview: "Noor: shipping the release notes tonight",
    previewTime: "09:12",
    messages: [
      {
        id: "g1",
        author: "Noor Sheikh",
        text: "Release candidate is green across all checks.",
        time: "09:02",
        reactions: [
          { emoji: "🚀", count: 4 },
          { emoji: "👏", count: 2 },
        ],
      },
      {
        id: "g2",
        author: "me",
        text: "Beautiful. Let's cut the build after standup.",
        time: "09:06",
        status: "read",
      },
      {
        id: "g3",
        author: "Noor Sheikh",
        text: "shipping the release notes tonight",
        time: "09:12",
      },
    ],
  },
  {
    id: "dev",
    name: "Dev Raman",
    initials: "DR",
    accent: "oklch(0.72 0.14 78)",
    role: "Frontend engineer",
    lastSeen: "Last seen 22 min ago",
    online: false,
    kind: "direct",
    preview: "Pushed the token refactor 👌",
    previewTime: "08:54",
    messages: [
      { id: "d1", author: "Dev Raman", text: "Pushed the token refactor 👌", time: "08:54" },
      { id: "d2", author: "me", text: "Reviewing now.", time: "08:58", status: "delivered" },
    ],
  },
  {
    id: "lina",
    name: "Lina Costa",
    initials: "LC",
    accent: "oklch(0.66 0.16 15)",
    role: "User research",
    lastSeen: "Last seen yesterday",
    online: false,
    kind: "direct",
    preview: "Six interviews scheduled for Friday.",
    previewTime: "Yest",
    messages: [
      {
        id: "l1",
        author: "Lina Costa",
        text: "Six interviews scheduled for Friday.",
        time: "18:20",
      },
    ],
  },
  {
    id: "founders",
    name: "Founders Room",
    initials: "FR",
    accent: "oklch(0.6 0.13 260)",
    role: "4 members",
    lastSeen: "2 online",
    online: true,
    kind: "group",
    members: [
      { name: "Mira Anand", initials: "MA", admin: true, role: "CEO" },
      { name: "Syed Abbuzar", initials: "SA", role: "You" },
      { name: "Noor Sheikh", initials: "NS", role: "CTO" },
    ],
    preview: "Mira: deck looks sharp.",
    previewTime: "Mon",
    messages: [{ id: "f1", author: "Mira Anand", text: "deck looks sharp.", time: "11:02" }],
  },
];

export const statusUpdates = {
  featured: {
    name: "Aria Kapoor",
    initials: "AK",
    caption: "Prototyping the new motion language",
    time: "24 min ago",
    segments: 4,
  },
  recent: [
    { name: "Noor Sheikh", initials: "NS", time: "1h ago", segments: 3, seen: 0 },
    { name: "Dev Raman", initials: "DR", time: "3h ago", segments: 2, seen: 0 },
    { name: "Mira Anand", initials: "MA", time: "5h ago", segments: 5, seen: 0 },
  ],
  viewed: [
    { name: "Lina Costa", initials: "LC", time: "9h ago", segments: 2, seen: 2 },
    { name: "Kabir Rao", initials: "KR", time: "Yesterday", segments: 4, seen: 4 },
  ],
};