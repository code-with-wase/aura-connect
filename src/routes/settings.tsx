import { createFileRoute } from "@tanstack/react-router";
import { Loader2, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell, PageHeader } from "@/components/aura/app-shell";
import { UserAvatar } from "@/components/aura/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import type { Privacy } from "@/lib/api-types";
import { getApiErrorMessage } from "@/lib/axios";
import { userService } from "@/services/userService";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Profile & settings — Aura Connect" },
      {
        name: "description",
        content: "Update your Aura Connect profile, privacy controls, read receipts and online presence.",
      },
      { property: "og:title", content: "Profile & settings — Aura Connect" },
      { property: "og:description", content: "Update your profile, privacy controls and presence." },
    ],
  }),
  component: () => (
    <AppShell>
      <SettingsPage />
    </AppShell>
  ),
});

const PRIVACY_OPTIONS: Privacy[] = ["everyone", "contacts", "nobody"];

function SettingsPage() {
  const { user, setUser, logout, refreshUser } = useAuth();
  const [profile, setProfile] = useState({ name: "", username: "", about: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name ?? "", username: user.username ?? "", about: user.about ?? "" });
    }
  }, [user]);

  if (!user) return null;

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await userService.updateProfile({
        name: profile.name,
        username: profile.username,
        about: profile.about,
      });
      setUser(updated);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not update profile"));
    } finally {
      setSavingProfile(false);
    }
  }

  async function updatePrivacy(payload: Record<string, unknown>) {
    setSavingPrivacy(true);
    try {
      const updated = await userService.updatePrivacy(payload);
      setUser(updated);
      toast.success("Privacy updated");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not update privacy"));
      await refreshUser();
    } finally {
      setSavingPrivacy(false);
    }
  }

  async function toggleOnline(isOnline: boolean) {
    try {
      const updated = await userService.updateOnlineStatus(isOnline);
      setUser(updated);
      toast.success(isOnline ? "You appear online" : "You appear offline");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not update presence"));
    }
  }

  return (
    <>
      <PageHeader
        title="Profile & settings"
        description="Manage your identity, privacy and presence."
        action={
          <Button variant="outline" size="sm" onClick={() => void logout()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        }
      />
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 md:px-6">
        <section className="rounded-lg border border-border bg-surface p-4 md:p-6">
          <div className="mb-4 flex items-center gap-3">
            <UserAvatar name={user.name} src={user.avatar} size={56} online={user.isOnline} />
            <div>
              <h2 className="text-base font-semibold text-foreground">{user.name}</h2>
              <p className="text-sm text-muted-foreground">
                @{user.username} · {user.email}
              </p>
            </div>
          </div>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={saveProfile}>
            <div className="space-y-2">
              <Label htmlFor="profile-name">Name</Label>
              <Input
                id="profile-name"
                value={profile.name}
                minLength={2}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-username">Username</Label>
              <Input
                id="profile-username"
                value={profile.username}
                minLength={3}
                pattern="[a-zA-Z0-9._]+"
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="profile-about">About</Label>
              <Textarea
                id="profile-about"
                maxLength={150}
                value={profile.about}
                onChange={(e) => setProfile({ ...profile, about: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={savingProfile}>
                {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save profile
              </Button>
            </div>
          </form>
        </section>

        <section className="space-y-4 rounded-lg border border-border bg-surface p-4 md:p-6">
          <h2 className="text-base font-semibold text-foreground">Privacy</h2>
          {(
            [
              ["lastSeen", "Last seen"],
              ["profilePhoto", "Profile photo"],
              ["about", "About"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <Label className="text-sm font-normal text-muted-foreground">{label}</Label>
              <Select
                value={user.privacy?.[key] ?? "everyone"}
                disabled={savingPrivacy}
                onValueChange={(value) => void updatePrivacy({ [key]: value })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIVACY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="read-receipts" className="text-sm font-normal text-muted-foreground">
              Read receipts
            </Label>
            <Switch
              id="read-receipts"
              checked={user.privacy?.readReceipts ?? true}
              disabled={savingPrivacy}
              onCheckedChange={(checked) => void updatePrivacy({ readReceipts: checked })}
            />
          </div>
        </section>

        <section className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4 md:p-6">
          <div>
            <h2 className="text-base font-semibold text-foreground">Online presence</h2>
            <p className="text-sm text-muted-foreground">Control whether colleagues see you as online.</p>
          </div>
          <Switch
            checked={Boolean(user.isOnline)}
            onCheckedChange={(checked) => void toggleOnline(checked)}
            aria-label="Toggle online presence"
          />
        </section>
      </div>
    </>
  );
}
