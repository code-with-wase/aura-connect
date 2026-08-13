import { Check, Image as ImageIcon, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  DEFAULT_WALLPAPER_ID,
  WALLPAPERS,
  clearChatWallpaper,
  getWallpaper,
  readWallpaperId,
  saveWallpaperId,
  setGlobalWallpaper,
} from "@/lib/wallpapers";

export function useChatWallpaper(chatId?: string) {
  const [id, setId] = useState(DEFAULT_WALLPAPER_ID);
  useEffect(() => {
    const sync = () => setId(readWallpaperId(chatId));
    sync();
    window.addEventListener("nexora-wallpaper-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("nexora-wallpaper-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, [chatId]);
  return { id, wallpaper: getWallpaper(id) };
}

export function WallpaperPicker({
  open,
  onOpenChange,
  chatId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatId?: string;
}) {
  const { id } = useChatWallpaper(chatId);
  const [selected, setSelected] = useState(id);

  useEffect(() => {
    if (open) setSelected(id);
  }, [open, id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Chat wallpaper</DialogTitle>
          <DialogDescription>
            {chatId ? "Choose a background for this conversation." : "Choose the default background for all chats."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[52vh] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-4">
          {WALLPAPERS.map((wp) => (
            <button
              key={wp.id}
              type="button"
              onClick={() => setSelected(wp.id)}
              className={cn(
                "group relative aspect-[3/4] overflow-hidden rounded-lg border text-left transition",
                selected === wp.id ? "border-accent ring-2 ring-accent/40" : "border-border hover:border-accent/60",
              )}
              aria-label={wp.label}
            >
              <span className="absolute inset-0" style={wp.style} />
              <span className="absolute inset-x-2 top-2 flex flex-col gap-1">
                <span className="h-3 w-3/5 rounded-full bg-surface/90" />
                <span className="ml-auto h-3 w-2/3 rounded-full bg-accent/80" />
              </span>
              {selected === wp.id && (
                <span className="absolute right-1.5 top-1.5 rounded-full bg-accent p-1 text-accent-foreground">
                  <Check className="h-3 w-3" />
                </span>
              )}
              <span className="absolute inset-x-0 bottom-0 truncate bg-surface/85 px-2 py-1 text-[11px] font-medium text-foreground">
                {wp.label}
              </span>
            </button>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {chatId ? (
            <Button
              variant="ghost"
              onClick={() => {
                clearChatWallpaper(chatId);
                toast.success("Reset to default wallpaper");
                onOpenChange(false);
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            {chatId && (
              <Button
                variant="outline"
                onClick={() => {
                  setGlobalWallpaper(selected);
                  clearChatWallpaper(chatId);
                  toast.success("Applied to all chats");
                  onOpenChange(false);
                }}
              >
                Apply to all
              </Button>
            )}
            <Button
              onClick={() => {
                saveWallpaperId(selected, chatId);
                toast.success("Wallpaper updated");
                onOpenChange(false);
              }}
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              Set wallpaper
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
