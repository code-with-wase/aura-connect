import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Contact as ContactIcon,
  LogOut,
  MessageSquare,
  Moon,
  Phone,
  Radio,
  Settings,
  Sun,
  Users,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import { notificationService } from "@/services/notificationService";
import { NexoraMark } from "@/components/aura/brand";

const NAV = [
  { to: "/", label: "Chats", icon: MessageSquare },
  { to: "/contacts", label: "Contacts", icon: ContactIcon },
  { to: "/groups", label: "Groups", icon: Users },
  { to: "/status", label: "Status", icon: Radio },
  { to: "/calls", label: "Calls", icon: Phone },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const THEME_KEY = "nexora-theme-mode";

function useTheme() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_KEY);
    const isDark = stored ? stored === "dark" : true;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem(THEME_KEY, next ? "dark" : "light");
  };
  return { dark, toggle };
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    notificationService
      .unreadCount()
      .then(setUnread)
      .catch(() => setUnread(0));
  }, [user, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <nav className="hidden w-[68px] shrink-0 flex-col items-center gap-1.5 border-r border-border bg-surface py-4 md:flex">
        <NexoraMark className="mb-4 h-10 w-10" />
        {NAV.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          return (
            <Tooltip key={item.to}>
              <TooltipTrigger asChild>
                <Link
                  to={item.to}
                  className={cn(
                    "relative flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition-all duration-200 hover:bg-surface-hover hover:text-foreground",
                    active &&
                      "bg-accent/10 text-accent shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--accent)_25%,transparent)]",
                  )}
                  aria-label={item.label}
                >
                  {active && (
                    <span className="absolute -left-[14px] h-6 w-[3px] rounded-full bg-accent" />
                  )}
                  <item.icon className="h-5 w-5" />
                  {item.to === "/notifications" && unread > 0 && (
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-surface" />
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
        <div className="mt-auto flex flex-col items-center gap-1 border-t border-border pt-3">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => void logout()} aria-label="Log out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col pb-14 md:pb-0">{children}</div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between border-t border-border bg-surface/95 px-1 py-1 backdrop-blur md:hidden">
        {NAV.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium text-muted-foreground transition-colors",
                active && "bg-accent/10 text-accent",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface/90 px-4 py-4 backdrop-blur md:px-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </header>
  );
}
