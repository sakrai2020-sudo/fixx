import { type ReactNode, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Menu, X, Home, User, Building2 } from "lucide-react";
import { Logo } from "./Logo";
import { supabase } from "@/integrations/supabase/client";
import { localLogout } from "@/lib/local-auth";

export function BusinessAppShell({ children, showBottomNav = true }: { children: ReactNode; showBottomNav?: boolean }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const close = () => setOpen(false);

  const onSignOut = async () => {
    close();
    localLogout();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const bottomPad = showBottomNav ? "pb-[calc(5rem+env(safe-area-inset-bottom,0px))]" : "pb-6";

  return (
    <div className="app-screen mx-auto w-full max-w-[390px] bg-background relative min-h-screen">
      <header className="shrink-0 z-30 flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur-md border-b border-border/50">
        <button type="button" data-inline="true" onClick={() => setOpen(true)} className="btn-inline p-2 -m-2" aria-label="תפריט">
          <Menu className="size-6" />
        </button>
        <Logo size={22} showSlogan={false} />
        <div className="w-10" aria-hidden />
      </header>

      <main className={`px-4 pt-2 ${bottomPad}`}>{children}</main>

      {showBottomNav && (
        <nav className="mobile-bottom-nav">
          <div className="grid grid-cols-3 text-sm">
            {[
              { to: "/business-dashboard", icon: Home, label: "לוח עסקי" },
              { to: "/business-onboarding", icon: Building2, label: "פרטי עסק" },
              { to: "/profile", icon: User, label: "פרופיל" },
            ].map((it) => {
              const active = pathname === it.to;
              const Icon = it.icon;
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  data-inline="true"
                  className="btn-inline flex flex-col items-center gap-1 py-3 min-h-[56px] justify-center"
                  style={{ color: active ? "var(--teal)" : "#C0C0C0" }}
                >
                  <Icon className="size-5" />
                  <span className="text-sm">{it.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {open && (
        <>
          <div className="absolute inset-0 z-40 bg-black/60" onClick={close} aria-hidden />
          <aside className="absolute top-0 bottom-0 right-0 z-50 w-[min(300px,88%)] bg-secondary border-l border-border p-5 overflow-y-auto app-scroll">
            <div className="flex items-center justify-between mb-6">
              <Logo size={24} showSlogan={false} />
              <button type="button" data-inline="true" onClick={close} className="btn-inline p-2 -m-2" aria-label="סגור">
                <X className="size-5" />
              </button>
            </div>
            <Link to="/business-dashboard" onClick={close} className="block py-3 text-sm">לוח עסקי</Link>
            <Link to="/business-onboarding" onClick={close} className="block py-3 text-sm">פרטי עסק</Link>
            <Link to="/dashboard" onClick={close} className="block py-3 text-sm text-muted-foreground">מעבר לחשבון אישי</Link>
            <button
              type="button"
              onClick={onSignOut}
              className="mt-6 text-sm w-full text-right"
              style={{ color: "var(--danger)" }}
            >
              התנתקות
            </button>
          </aside>
        </>
      )}
    </div>
  );
}
