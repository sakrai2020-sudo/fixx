import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogoOrb } from "@/components/Logo";
import { MarketingHero } from "@/components/MarketingHero";
import { useAuth } from "@/lib/auth";
import { localLogin, LOCAL_TEST_USER } from "@/lib/local-auth";
import { setLocalAccountType, resolvePostLoginPath } from "@/lib/account-type";
import { supabase, SUPABASE_AUTH_REDIRECT_URL } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: Auth,
});

// ─── SVG brand icons ────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.332 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
      <path d="M6.306 14.691l6.571 4.819C14.655 15.108 19.001 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
      <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.313 0-9.822-3.547-11.248-8.413l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
      <path d="M43.611 20.083H42V20H24v8h11.303a11.998 11.998 0 01-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

type Mode = "signin" | "signup";

function Auth() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState<string>(LOCAL_TEST_USER.email);
  const [password, setPassword] = useState<string>(LOCAL_TEST_USER.password);
  const [busy, setBusy] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<"google" | "apple" | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    resolvePostLoginPath(user.id, "local").then((path) => {
      navigate({ to: path, replace: true });
    });
  }, [loading, user, navigate]);

  // ── OAuth ────────────────────────────────────────────────────────────────

  const handleOAuth = async (provider: "google" | "apple") => {
    setOauthBusy(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: SUPABASE_AUTH_REDIRECT_URL },
      });
      if (error) throw error;
      // browser redirects — nothing else to do
    } catch (e: any) {
      const msg = e?.message || "";
      if (msg.includes("Missing Supabase") || msg.includes("environment variable")) {
        toast.error("OAuth אינו זמין בסביבת הפיתוח — השתמש באימייל/סיסמה");
      } else {
        toast.error(msg || "שגיאה בהתחברות עם OAuth");
      }
      setOauthBusy(null);
    }
  };

  // ── Local email/password ─────────────────────────────────────────────────

  const handleEmailAuth = () => {
    if (!email.trim()) { toast.error("יש להזין כתובת אימייל"); return; }
    if (!password)     { toast.error("יש להזין סיסמה"); return; }
    setBusy(true);
    if (localLogin(email, password)) {
      setLocalAccountType("personal");
      window.location.href = "/dashboard";
    } else {
      toast.error("אימייל או סיסמה שגויים");
      setBusy(false);
    }
  };

  const handleBusinessEntry = () => {
    if (!email.trim()) { toast.error("יש להזין כתובת אימייל"); return; }
    if (!password)     { toast.error("יש להזין סיסמה"); return; }
    setBusy(true);
    if (localLogin(email, password)) {
      setLocalAccountType("business");
      window.location.href = "/business-onboarding";
    } else {
      toast.error("אימייל או סיסמה שגויים");
      setBusy(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="w-full bg-background"
      style={{
        minHeight: "100dvh",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex flex-col px-5 py-10 w-full max-w-sm mx-auto sm:px-6">

        {/* Logo + headline */}
        <div className="flex flex-col items-center text-center mb-8">
          <LogoOrb size={64} />
          <div className="mt-6 w-full">
            <MarketingHero />
          </div>
        </div>

        {/* Sign in / Sign up toggle */}
        <div className="flex rounded-2xl border border-border overflow-hidden mb-6">
          {(["signin", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className="flex-1 min-h-[44px] flex items-center justify-center text-sm font-semibold transition-colors"
              style={
                mode === m
                  ? { background: "var(--primary)", color: "var(--primary-foreground)" }
                  : { background: "transparent", color: "var(--muted-foreground)" }
              }
            >
              {m === "signin" ? "כניסה" : "הרשמה"}
            </button>
          ))}
        </div>

        {/* ── Primary: OAuth buttons ── */}
        <div className="flex flex-col gap-3">

          {/* Google */}
          <button
            type="button"
            disabled={oauthBusy !== null || busy}
            onClick={() => handleOAuth("google")}
            className="w-full min-h-[48px] rounded-2xl font-semibold text-sm flex items-center justify-center gap-3 transition-opacity disabled:opacity-60"
            style={{ background: "#ffffff", color: "#1f1f1f", border: "1px solid #dadce0" }}
          >
            {oauthBusy === "google" ? (
              <Loader2 className="size-5 animate-spin" style={{ color: "#1f1f1f" }} />
            ) : (
              <GoogleIcon />
            )}
            {mode === "signin" ? "המשך עם Google" : "הרשמה עם Google"}
          </button>

          {/* Apple */}
          <button
            type="button"
            disabled={oauthBusy !== null || busy}
            onClick={() => handleOAuth("apple")}
            className="w-full min-h-[48px] rounded-2xl font-semibold text-sm flex items-center justify-center gap-3 transition-opacity disabled:opacity-60"
            style={{ background: "#000000", color: "#ffffff", border: "1px solid #333" }}
          >
            {oauthBusy === "apple" ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <AppleIcon />
            )}
            {mode === "signin" ? "המשך עם Apple" : "הרשמה עם Apple"}
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden>
            <div className="w-full border-t border-border" />
          </div>
          <p className="relative text-center text-xs text-muted-foreground bg-background px-3 mx-auto w-fit">
            או עם אימייל
          </p>
        </div>

        {/* ── Secondary: email/password ── */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-right">אימייל</label>
            <input
              dir="ltr"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              placeholder="your@email.com"
              className="w-full min-h-[44px] rounded-2xl px-4 text-sm bg-secondary border border-border text-white outline-none focus:border-primary"
              style={{ fontSize: 16 }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-right">סיסמה</label>
            <input
              dir="ltr"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full min-h-[44px] rounded-2xl px-4 text-sm bg-secondary border border-border text-white outline-none focus:border-primary"
              style={{ fontSize: 16 }}
              onKeyDown={(e) => { if (e.key === "Enter") handleEmailAuth(); }}
            />
          </div>

          <button
            type="button"
            disabled={busy || oauthBusy !== null}
            aria-busy={busy}
            onClick={handleEmailAuth}
            className="w-full min-h-[44px] rounded-2xl font-bold text-sm btn-primary flex items-center justify-center gap-2 mt-1 disabled:opacity-60"
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {mode === "signin" ? "מתחבר…" : "נרשם…"}
              </>
            ) : (
              mode === "signin" ? "כניסה עם אימייל" : "הרשמה עם אימייל"
            )}
          </button>
        </div>

        {/* Business login */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden>
            <div className="w-full border-t border-border" />
          </div>
          <p className="relative text-center text-xs text-muted-foreground bg-background px-3 mx-auto w-fit">
            עסק?
          </p>
        </div>

        <button
          type="button"
          disabled={busy || oauthBusy !== null}
          onClick={handleBusinessEntry}
          className="w-full min-h-[44px] rounded-xl font-bold text-sm border flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ borderColor: "var(--teal)", color: "var(--teal)" }}
        >
          כניסה כלקוח עסקי
        </button>

        <p className="text-center text-[11px] text-muted-foreground mt-8 leading-relaxed">
          בהמשך אתה מסכים ל
          <a href="/terms" className="underline mx-1" style={{ color: "var(--primary)" }}>תנאי השימוש</a>
          ו
          <a href="/privacy" className="underline mx-1" style={{ color: "var(--primary)" }}>מדיניות הפרטיות</a>
        </p>

      </div>
    </div>
  );
}
