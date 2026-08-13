import { Crown, Mail, MapPin, Phone, Bell, ShieldCheck, Images, Plus } from "lucide-react";

import { NxAvatar } from "./avatar";
import { me, statusUpdates, type Conversation } from "@/lib/nexora-data";

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-border bg-surface p-5 shadow-[var(--shadow-bubble)]">
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-[0.7rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
      {children}
    </h3>
  );
}

function Ring({
  initials,
  accent,
  segments,
  seen,
  size = 56,
}: {
  initials: string;
  accent?: string;
  segments: number;
  seen: number;
  size?: number;
}) {
  const gap = 6;
  const per = 360 / segments;
  const stops = Array.from({ length: segments }, (_, i) => {
    const from = i * per + gap / 2;
    const to = (i + 1) * per - gap / 2;
    const color = i < seen ? "var(--border)" : "var(--brand)";
    return `${color} ${from}deg ${to}deg, transparent ${to}deg ${to + gap}deg`;
  }).join(", ");

  return (
    <span
      className="grid shrink-0 place-items-center rounded-full p-[3px]"
      style={{ width: size, height: size, background: `conic-gradient(${stops})` }}
    >
      <span className="grid h-full w-full place-items-center rounded-full bg-surface p-[2px]">
        <NxAvatar initials={initials} accent={accent} size="sm" className="h-full w-full" />
      </span>
    </span>
  );
}

export function StatusPanel() {
  const { featured, recent, viewed } = statusUpdates;
  return (
    <div className="h-full space-y-5 overflow-y-auto bg-sidebar p-5">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Status</h2>
          <p className="text-xs text-muted-foreground">Moments that disappear in 24 hours</p>
        </div>
        <button
          className="grid h-10 w-10 place-items-center rounded-full text-primary-foreground shadow-[var(--shadow-float)] transition-transform hover:-translate-y-0.5"
          style={{ backgroundImage: "var(--gradient-brand)" }}
          aria-label="Add a status update"
        >
          <Plus className="h-5 w-5" />
        </button>
      </header>

      <div
        className="relative overflow-hidden rounded-3xl border border-border p-5"
        style={{
          backgroundImage:
            "linear-gradient(140deg, color-mix(in oklab, var(--brand) 22%, var(--surface)), color-mix(in oklab, var(--cyan) 16%, var(--surface)))",
        }}
      >
        <span className="text-[0.65rem] font-bold tracking-[0.14em] uppercase opacity-70">
          Featured
        </span>
        <div className="mt-4 flex items-center gap-4">
          <Ring initials={featured.initials} segments={featured.segments} seen={0} size={68} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{featured.name}</p>
            <p className="truncate text-xs opacity-80">{featured.caption}</p>
            <p className="mt-1 text-[0.65rem] opacity-70">{featured.time}</p>
          </div>
        </div>
      </div>

      <section>
        <SectionTitle>Recent updates</SectionTitle>
        <div className="space-y-1">
          {recent.map((s) => (
            <button
              key={s.name}
              className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition-colors hover:bg-surface-hover"
            >
              <Ring initials={s.initials} segments={s.segments} seen={s.seen} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{s.name}</span>
                <span className="block text-xs text-muted-foreground">{s.time}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Viewed</SectionTitle>
        <div className="space-y-1">
          {viewed.map((s) => (
            <button
              key={s.name}
              className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left opacity-70 transition-colors hover:bg-surface-hover hover:opacity-100"
            >
              <Ring initials={s.initials} segments={s.segments} seen={s.seen} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{s.name}</span>
                <span className="block text-xs text-muted-foreground">{s.time}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export function ProfilePanel() {
  return (
    <div className="h-full space-y-4 overflow-y-auto bg-sidebar p-5">
      <div
        className="relative overflow-hidden rounded-3xl border border-border p-6 text-center"
        style={{
          backgroundImage:
            "linear-gradient(160deg, color-mix(in oklab, var(--brand) 20%, var(--surface)), var(--surface))",
        }}
      >
        <NxAvatar initials={me.initials} size="xl" online className="mx-auto" />
        <h2 className="mt-4 text-xl font-bold">{me.name}</h2>
        <p className="text-xs text-muted-foreground">{me.username}</p>
        <p className="mx-auto mt-3 max-w-xs text-sm">{me.about}</p>
      </div>

      <Card>
        <SectionTitle>Contact</SectionTitle>
        <ul className="space-y-3 text-sm">
          <li className="flex items-center gap-3">
            <Mail className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
            <span className="truncate">{me.email}</span>
          </li>
          <li className="flex items-center gap-3">
            <Phone className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
            <span>{me.phone}</span>
          </li>
          <li className="flex items-center gap-3">
            <MapPin className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
            <span>{me.location}</span>
          </li>
        </ul>
      </Card>

      <Card>
        <SectionTitle>Preferences</SectionTitle>
        <ul className="space-y-3 text-sm">
          <li className="flex items-center gap-3">
            <Bell className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
            Notifications · All conversations
          </li>
          <li className="flex items-center gap-3">
            <ShieldCheck className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
            Privacy · Contacts only
          </li>
          <li className="flex items-center gap-3">
            <Images className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
            Media auto-download · Wi-Fi
          </li>
        </ul>
      </Card>
    </div>
  );
}

export function DetailsPanel({ conversation }: { conversation: Conversation }) {
  return (
    <aside className="hidden h-full w-80 shrink-0 space-y-4 overflow-y-auto border-l border-border bg-sidebar p-5 xl:block">
      <div className="text-center">
        <NxAvatar
          initials={conversation.initials}
          accent={conversation.accent}
          size="lg"
          online={conversation.online}
          className="mx-auto"
        />
        <h2 className="mt-3 text-base font-bold">{conversation.name}</h2>
        <p className="text-xs text-muted-foreground">{conversation.role}</p>
      </div>

      {conversation.kind === "group" ? (
        <Card>
          <SectionTitle>Members</SectionTitle>
          <ul className="space-y-3">
            {conversation.members?.map((m) => (
              <li key={m.name} className="flex items-center gap-3">
                <NxAvatar initials={m.initials} size="sm" accent={conversation.accent} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold">{m.name}</span>
                    {m.admin ? (
                      <Crown className="h-3.5 w-3.5 shrink-0 text-highlight" aria-label="Admin" />
                    ) : null}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">{m.role}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Card>
          <SectionTitle>About</SectionTitle>
          <p className="text-sm text-muted-foreground">
            {conversation.lastSeen} · Shared media, links and documents appear here.
          </p>
        </Card>
      )}

      <Card>
        <SectionTitle>{conversation.kind === "group" ? "Group settings" : "Settings"}</SectionTitle>
        <ul className="space-y-2.5 text-sm">
          <li className="flex items-center justify-between">
            <span>Mute</span>
            <span className="text-xs text-muted-foreground">Off</span>
          </li>
          <li className="flex items-center justify-between">
            <span>Disappearing messages</span>
            <span className="text-xs text-muted-foreground">7 days</span>
          </li>
          <li className="flex items-center justify-between">
            <span>Encryption</span>
            <span className="text-xs text-online">Verified</span>
          </li>
        </ul>
      </Card>
    </aside>
  );
}