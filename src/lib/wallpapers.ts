export type Wallpaper = {
  id: string;
  label: string;
  style: Record<string, string>;
};

const soft = "color-mix(in oklab, var(--accent) 12%, transparent)";
const faint = "color-mix(in oklab, var(--foreground) 6%, transparent)";

export const WALLPAPERS: Wallpaper[] = [
  {
    id: "nexora",
    label: "Nexora Default",
    style: {
      backgroundColor: "var(--color-background)",
      backgroundImage: `radial-gradient(circle at 12% 8%, ${soft} 0%, transparent 45%), radial-gradient(circle at 88% 92%, color-mix(in oklab, var(--chart-2) 14%, transparent) 0%, transparent 45%), linear-gradient(to right, ${faint} 1px, transparent 1px), linear-gradient(to bottom, ${faint} 1px, transparent 1px)`,
      backgroundSize: "100% 100%, 100% 100%, 34px 34px, 34px 34px",
    },
  },
  {
    id: "plain",
    label: "Plain",
    style: { backgroundColor: "var(--color-background)", backgroundImage: "none" },
  },
  {
    id: "graphite",
    label: "Graphite Grid",
    style: {
      backgroundColor: "var(--color-background)",
      backgroundImage: `linear-gradient(to right, ${faint} 1px, transparent 1px), linear-gradient(to bottom, ${faint} 1px, transparent 1px)`,
      backgroundSize: "24px 24px",
    },
  },
  {
    id: "dots",
    label: "Quiet Dots",
    style: {
      backgroundColor: "var(--color-background)",
      backgroundImage: `radial-gradient(color-mix(in oklab, var(--foreground) 14%, transparent) 1px, transparent 1px)`,
      backgroundSize: "18px 18px",
    },
  },
  {
    id: "diagonal",
    label: "Diagonal Weave",
    style: {
      backgroundColor: "var(--color-background)",
      backgroundImage: `repeating-linear-gradient(45deg, ${faint} 0 1px, transparent 1px 12px)`,
    },
  },
  {
    id: "aurora",
    label: "Aurora",
    style: {
      backgroundColor: "var(--color-background)",
      backgroundImage: `radial-gradient(60% 60% at 20% 20%, color-mix(in oklab, var(--accent) 20%, transparent) 0%, transparent 60%), radial-gradient(60% 60% at 80% 70%, color-mix(in oklab, var(--chart-2) 20%, transparent) 0%, transparent 60%)`,
    },
  },
  {
    id: "midnight",
    label: "Midnight Fade",
    style: {
      backgroundImage: `linear-gradient(180deg, color-mix(in oklab, var(--accent) 10%, var(--color-background)) 0%, var(--color-background) 60%, color-mix(in oklab, var(--foreground) 6%, var(--color-background)) 100%)`,
    },
  },
  {
    id: "waves",
    label: "Soft Waves",
    style: {
      backgroundColor: "var(--color-background)",
      backgroundImage: `repeating-radial-gradient(circle at 50% 120%, ${soft} 0 2px, transparent 2px 44px)`,
    },
  },
];

export const DEFAULT_WALLPAPER_ID = "nexora";

const GLOBAL_KEY = "nexora-wallpaper";
const chatKey = (chatId: string) => `nexora-wallpaper:${chatId}`;

export function getWallpaper(id: string | null | undefined): Wallpaper {
  return WALLPAPERS.find((w) => w.id === id) ?? WALLPAPERS[0]!;
}

export function readWallpaperId(chatId?: string): string {
  if (typeof window === "undefined") return DEFAULT_WALLPAPER_ID;
  const perChat = chatId ? window.localStorage.getItem(chatKey(chatId)) : null;
  return perChat ?? window.localStorage.getItem(GLOBAL_KEY) ?? DEFAULT_WALLPAPER_ID;
}

export function saveWallpaperId(id: string, chatId?: string) {
  if (typeof window === "undefined") return;
  if (chatId) window.localStorage.setItem(chatKey(chatId), id);
  else window.localStorage.setItem(GLOBAL_KEY, id);
  window.dispatchEvent(new CustomEvent("nexora-wallpaper-change"));
}

export function clearChatWallpaper(chatId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(chatKey(chatId));
  window.dispatchEvent(new CustomEvent("nexora-wallpaper-change"));
}

export function setGlobalWallpaper(id: string) {
  saveWallpaperId(id);
}
