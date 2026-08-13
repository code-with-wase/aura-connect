import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Lock, MessagesSquare, Users2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";
import { getApiErrorMessage } from "@/lib/axios";
import { NexoraMark, NexoraWordmark } from "@/components/aura/brand";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Nexora" },
      {
        name: "description",
        content: "Sign in or create your Nexora account to access secure team messaging.",
      },
      { property: "og:title", content: "Sign in — Nexora" },
      {
        property: "og:description",
        content: "Access secure enterprise messaging, groups, calls and status updates.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { login, register, user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("login");

  const [loginForm, setLoginForm] = useState({ identifier: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
  });

  useEffect(() => {
    if (!loading && user) void navigate({ to: "/" });
  }, [loading, user, navigate]);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await login(loginForm);
      toast.success("Signed in");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to sign in"));
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await register(signupForm);
      toast.success("Account created. Please sign in.");
      setLoginForm({ identifier: signupForm.email, password: "" });
      setTab("login");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to create account"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_1fr]">
      <section className="nx-brand-gradient relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
        <div className="nx-grid-bg absolute inset-0 opacity-15" aria-hidden />
        <div className="relative flex items-center gap-3">
          <NexoraMark className="h-10 w-10 bg-white/15 shadow-none" />
          <NexoraWordmark className="text-accent-foreground" />
        </div>
        <div className="relative max-w-md text-accent-foreground">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            Enterprise messaging, built for focused teams.
          </h2>
          <p className="mt-3 text-sm text-accent-foreground/80">
            Real-time chats, groups, calls and status updates in one secure workspace.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-accent-foreground/90">
            <li className="flex items-center gap-3">
              <MessagesSquare className="h-4 w-4" /> Instant direct and group messaging
            </li>
            <li className="flex items-center gap-3">
              <Users2 className="h-4 w-4" /> Roles, permissions and member controls
            </li>
            <li className="flex items-center gap-3">
              <Lock className="h-4 w-4" /> Privacy controls and blocked-user management
            </li>
          </ul>
        </div>
        <p className="relative text-xs text-accent-foreground/70">
          &copy; {new Date().getFullYear()} Nexora
        </p>
      </section>

      <section className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="nx-rise w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <NexoraMark className="h-10 w-10" />
            <div>
              <NexoraWordmark />
              <p className="text-sm text-muted-foreground">Secure messaging for modern teams</p>
            </div>
          </div>

          <div className="mb-6 hidden lg:block">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to your Nexora workspace to continue.
            </p>
          </div>

          <div className="nx-elevate rounded-2xl border border-border bg-surface p-6 sm:p-7">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign in</TabsTrigger>
              <TabsTrigger value="register">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <form className="space-y-4" onSubmit={handleLogin}>
                <div className="space-y-2">
                  <Label htmlFor="identifier">Email, username or phone</Label>
                  <Input
                    id="identifier"
                    required
                    value={loginForm.identifier}
                    onChange={(e) => setLoginForm({ ...loginForm, identifier: e.target.value })}
                    placeholder="you@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-6">
              <form className="space-y-4" onSubmit={handleRegister}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      required
                      minLength={2}
                      value={signupForm.name}
                      onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      required
                      minLength={3}
                      pattern="[a-zA-Z0-9._]+"
                      value={signupForm.username}
                      onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Work email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (digits only)</Label>
                  <Input
                    id="phone"
                    required
                    minLength={10}
                    maxLength={15}
                    pattern="[0-9]+"
                    value={signupForm.phone}
                    onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    required
                    minLength={6}
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Protected workspace. By continuing you agree to Nexora&apos;s acceptable use policy.
          </p>
        </div>
      </section>
    </main>
  );
}
