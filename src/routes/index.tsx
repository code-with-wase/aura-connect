import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageCircle, CircleDashed, Users, User, Moon, Sun } from "lucide-react";
import { toast } from "sonner";

import { ChatList } from "@/components/nexora/chat-list";
import { ChatView } from "@/components/nexora/chat-view";
import { DetailsPanel, ProfilePanel, StatusPanel } from "@/components/nexora/panels";
import { Welcome } from "@/components/nexora/welcome";
import { NexoraMark } from "@/components/nexora/logo";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { conversations } from "@/lib/nexora-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nexora — Your conversations, beautifully connected" },
      {
        name: "description",
        content:
          "Nexora is a premium messaging workspace with a calm chat canvas, threaded replies, reactions and status updates.",
      },
      { property: "og:title", content: "Nexora — Messaging, refined" },
      {
        property: "og:description",
        content:
          "A premium messaging experience: calm chat canvas, threaded replies, reactions and status.",
      },
    ],
  }),
  component: Index,
});

type Tab = "chats" | "status" | "groups" | "profile";

const tabs: { id: Tab; label: string; icon: typeof MessageCircle }[] = [
  { id: "chats", label: "Chats", icon: MessageCircle },
  { id: "status", label: "Status", icon: CircleDashed },
  { id: "groups", label: "Groups", icon: Users },
  { id: "profile", label: "Profile", icon: User },
];

function Index() {
  const [tab, setTab] = useState<Tab>("chats");
  const [activeId, setActiveId] = useState<string | null>("aria");
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(true);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const listItems =
    tab === "groups" ? conversations.filter((c) => c.kind === "group") : conversations;

  function newChat() {
    toast("New conversation", { description: "Pick a contact to start messaging on Nexora." });
  }

  return (
    <main className="flex h-screen overflow-hidden bg-background text-foreground">
      <nav
        aria-label="Primary"
        className="hidden w-[4.5rem] shrink-0 flex-col items-center gap-2 border-r border-border bg-sidebar py-5 lg:flex"
      >
        <NexoraMark className="mb-4 h-10 w-10" />
        {tabs.map((t) => (
          <Tooltip key={t.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setTab(t.id)}
                aria-label={t.label}
                aria-current={tab === t.id ? "page" : undefined}
                className={cn(
                  "relative grid h-11 w-11 place-items-center rounded-2xl transition-all duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  tab === t.id
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
                )}
              >
                <t.icon className="h-[1.15rem] w-[1.15rem]" />
                {tab === t.id ? (
                  <span
                    aria-hidden="true"
                    className="absolute -left-[1.05rem] h-6 w-[3px] rounded-full bg-brand"
                  />
                ) : null}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{t.label}</TooltipContent>
          </Tooltip>
        ))}
        <div className="mt-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setDark((v) => !v)}
                aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
                className="grid h-11 w-11 place-items-center rounded-2xl text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
              >
                {dark ? (
                  <Sun className="h-[1.15rem] w-[1.15rem]" />
                ) : (
                  <Moon className="h-[1.15rem] w-[1.15rem]" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{dark ? "Light theme" : "Dark theme"}</TooltipContent>
          </Tooltip>
        </div>
      </nav>

      <div
        className={cn(
          "relative min-h-0 w-full shrink-0 flex-col border-r border-border lg:flex lg:w-[22rem]",
          mobileChatOpen ? "hidden lg:flex" : "flex",
        )}
      >
        <div className="relative min-h-0 flex-1">
          {tab === "status" ? (
            <StatusPanel />
          ) : tab === "profile" ? (
            <ProfilePanel />
          ) : (
            <ChatList
              items={listItems}
              activeId={activeId}
              onSelect={(id) => {
                setActiveId(id);
                setMobileChatOpen(true);
              }}
              onNewChat={newChat}
              onOpenProfile={() => setTab("profile")}
            />
          )}
        </div>

        <nav
          aria-label="Sections"
          className="nx-glass flex items-center justify-around border-x-0 border-b-0 px-2 py-2 lg:hidden"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={cn(
                "flex min-h-11 min-w-11 flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[0.65rem] font-semibold transition-colors",
                tab === t.id ? "text-brand" : "text-muted-foreground",
              )}
            >
              <t.icon className="h-5 w-5" />
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      <div
        className={cn("min-h-0 min-w-0 flex-1", mobileChatOpen ? "flex" : "hidden lg:flex")}
      >
        {active ? (
          <>
            <div className="min-w-0 flex-1">
              <ChatView
                conversation={active}
                onBack={() => setMobileChatOpen(false)}
                infoOpen={infoOpen}
                onToggleInfo={() => setInfoOpen((v) => !v)}
              />
            </div>
            {infoOpen ? <DetailsPanel conversation={active} /> : null}
          </>
        ) : (
          <div className="flex-1">
            <Welcome onNewChat={newChat} />
          </div>
        )}
      </div>
    </main>
  );
}
