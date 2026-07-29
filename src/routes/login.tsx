import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

import { login, isAuthenticated } from "@/lib/auth";
import { ApiError } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — ERAP" },
      { name: "description", content: "Sign in to the ERAP Remote Administration Console." },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  beforeLoad: () => {
    if (typeof window !== "undefined" && isAuthenticated()) {
      throw redirect({ to: "/" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    const nextErrors: { username?: string; password?: string } = {};
    if (!username.trim()) nextErrors.username = "Username is required.";
    if (!password) nextErrors.password = "Password is required.";
    setErrors(nextErrors);
    if (nextErrors.username || nextErrors.password) return;
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      if (search.redirect && search.redirect !== "/login") {
        // Use the browser navigator for arbitrary hrefs so we don't fight the
        // typed route registry (paths can include unknown query strings).
        window.location.assign(search.redirect);
      } else {
        navigate({ to: "/" });
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Sign in failed. Please try again.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="flex min-h-dvh items-center justify-center px-4 py-10"
      style={{
        backgroundImage:
          "linear-gradient(160deg, #10192A 0%, #1B2A44 60%, #21355A 100%)",
      }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground text-lg font-bold shadow-lg">
            E
          </div>
          <div className="leading-tight text-left">
            <div className="text-lg font-bold tracking-wide text-white">ERAP</div>
            <div className="text-[11px] text-white/60">
              Enterprise Remote Administration Platform
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/5 bg-card p-7 shadow-2xl">
          <h1 className="text-base font-semibold">Sign in</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Authorized IT personnel only. All activity is logged.
          </p>
          <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errors.username) setErrors((p) => ({ ...p, username: undefined }));
                }}
                disabled={submitting}
                aria-invalid={!!errors.username}
                aria-describedby={errors.username ? "username-error" : undefined}
              />
              {errors.username && (
                <p id="username-error" className="text-xs text-destructive">
                  {errors.username}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                  }}
                  disabled={submitting}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={submitting}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-2 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-xs text-destructive">
                  {errors.password}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign In"}
            </Button>
          </form>
        </div>
        <p className="mt-4 text-center font-mono text-[11px] text-white/40">
          v2.5 · private WAN · sessions brokered via RustDesk
        </p>
      </div>
    </div>
  );
}