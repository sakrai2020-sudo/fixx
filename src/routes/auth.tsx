import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogoOrb } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { localLogin, LOCAL_TEST_USER } from "@/lib/local-auth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: Auth,
});

function Auth() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState(LOCAL_TEST_USER.email);
  const [password, setPassword] = useState(LOCAL_TEST_USER.password);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    navigate({ to: "/dashboard", replace: true });
  }, [loading, user, navigate]);

  const handleLogin = () => {
    if (!email.trim()) {
      toast.error("יש להזין כתובת אימייל");
      return;
    }
    if (!password) {
      toast.error("יש להזין סיסמה");
      return;
    }
    setBusy(true);
    if (localLogin(email, password)) {
      window.location.href = "/dashboard";
    } else {
      toast.error("אימייל או סיסמה שגויים");
      setBusy(false);
    }
  };

  return (
    <div className="app-screen w-full min-h-screen px-6 py-10 bg-background">
      <div className="flex flex-col justify-center">
        <div className="flex flex-col items-center text-center mb-10">
          <LogoOrb size={64} />
        </div>

        <div className="flex flex-col gap-3 w-full">
          <label className="text-xs font-semibold text-right">אימייל</label>
          <input
            dir="ltr"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value.trim())}
            placeholder="your@email.com"
            className="w-full min-h-11 rounded-2xl px-4 text-sm bg-secondary border border-border text-white outline-none focus:border-primary"
          />
          <label className="text-xs font-semibold text-right mt-1">סיסמה</label>
          <input
            dir="ltr"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full min-h-11 rounded-2xl px-4 text-sm bg-secondary border border-border text-white outline-none focus:border-primary"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleLogin();
            }}
          />
          <button
            type="button"
            disabled={busy}
            aria-busy={busy}
            onClick={handleLogin}
            className="mobile-full w-full min-h-11 rounded-2xl font-bold text-sm btn-primary flex items-center justify-center gap-2 mt-2"
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                מתחבר…
              </>
            ) : (
              "כניסה"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
