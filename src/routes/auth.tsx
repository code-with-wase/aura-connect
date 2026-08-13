import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { NexoraMark, NexoraWordmark } from "@/components/aura/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";
import { getApiErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";

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

function passwordScore(value: string) {
  let score = 0;
  if (value.length >= 6) score += 1;
  if (value.length >= 10) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/[0-9]/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  return Math.min(score, 4);
}

const STRENGTH_LABEL = ["Too short", "Weak", "Fair", "Good", "Strong"];

function PasswordField({
  id,
  label,
  value,
  onChange,
  minLength,
  autoComplete,
  showStrength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  minLength?: number;
  autoComplete?: string;
  showStrength?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const score = passwordScore(value);
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          required
          minLength={minLength ?? undefined}
          autoComplete={autoComplete ?? undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {showStrength && value.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i < score ? "bg-accent" : "bg-border",
                )}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Password strength: {STRENGTH_LABEL[score]}</p>
        </div>
      )}
    </div>
  );
}

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

  const loginReady = loginForm.identifier.trim().length > 2 && loginForm.password.length >= 6;
  const usernameError = useMemo(() => {
    if (!signupForm.username) return null;
    if (signupForm.username.length < 3) return "At least 3 characters";
    if (!/^[a-zA-Z0-9._]+$/.test(signupForm.username)) return "Only letters, numbers, dot and underscore";
    return null;
  }, [signupForm.username]);
  const phoneError = useMemo(() => {
    if (!signupForm.phone) return null;
    if (!/^[0-9]{10,15}$/.test(signupForm.phone)) return "Enter 10–15 digits";
    return null;
  }, [signupForm.phone]);
  const signupReady =
    signupForm.name.trim().length >= 2 &&
    !usernameError &&
    signupForm.username.length >= 3 &&
    /\S+@\S+\.\S+/.test(signupForm.email) &&
    !phoneError &&
    signupForm.phone.length >= 10 &&
    signupForm.password.length >= 6;

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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="nx-grid-bg absolute inset-0 opacity-40" aria-hidden />
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[38rem] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
        aria-hidden
      />

      <div className="nx-rise relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <NexoraMark className="h-12 w-12" />
          <div className="mt-3">
            <NexoraWordmark />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
            {tab === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tab === "login"
              ? "Sign in to your Nexora workspace to continue."
              : "A few details and your workspace is ready."}
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
                    autoComplete="username"
                    value={loginForm.identifier}
                    onChange={(e) => setLoginForm({ ...loginForm, identifier: e.target.value })}
                    placeholder="you@company.com"
                  />
                </div>
                <PasswordField
                  id="password"
                  label="Password"
                  autoComplete="current-password"
                  value={loginForm.password}
                  onChange={(value) => setLoginForm({ ...loginForm, password: value })}
                />
                <Button type="submit" className="group w-full" disabled={busy || !loginReady}>
                  {busy ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  )}
                  Sign in
                </Button>
                <button
                  type="button"
                  onClick={() => setTab("register")}
                  className="w-full text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  New to Nexora? <span className="font-medium text-accent">Create an account</span>
                </button>
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
                    <div className="relative">
                      <Input
                        id="username"
                        required
                        minLength={3}
                        pattern="[a-zA-Z0-9._]+"
                        className="pr-8"
                        value={signupForm.username}
                        onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })}
                      />
                      {signupForm.username && !usernameError && (
                        <Check className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
                      )}
                    </div>
                    {usernameError && <p className="text-xs text-destructive">{usernameError}</p>}
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
                    inputMode="numeric"
                    minLength={10}
                    maxLength={15}
                    pattern="[0-9]+"
                    value={signupForm.phone}
                    onChange={(e) =>
                      setSignupForm({ ...signupForm, phone: e.target.value.replace(/[^0-9]/g, "") })
                    }
                  />
                  {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
                </div>
                <PasswordField
                  id="new-password"
                  label="Password"
                  autoComplete="new-password"
                  minLength={6}
                  showStrength
                  value={signupForm.password}
                  onChange={(value) => setSignupForm({ ...signupForm, password: value })}
                />
                <Button type="submit" className="w-full" disabled={busy || !signupReady}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create account
                </Button>
                <button
                  type="button"
                  onClick={() => setTab("login")}
                  className="w-full text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Already have an account? <span className="font-medium text-accent">Sign in</span>
                </button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          Protected workspace. By continuing you agree to Nexora&apos;s acceptable use policy.
        </p>
      </div>
    </main>
  );
}
