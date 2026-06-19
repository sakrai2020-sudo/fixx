import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Menu, X, Home, BarChart3, Bell, User } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "./Logo";
import { BiometricEnrollPrompt } from "./BiometricEnrollPrompt";
import { supabase } from "@/integrations/supabase/client";
import { localLogout } from "@/lib/local-auth";

export function AppShell({ children, showBottomNav = true }: { children: ReactNode; showBottomNav?: boolean }) {
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
  const onDeleteAccount = async () => {
    if (!window.confirm("האם אתה בטוח שברצונך למחוק את החשבון? פעולה זו בלתי הפיכה.")) return;
    close();
    toast.success("בקשת המחיקה התקבלה. החשבון יימחק תוך 30 יום.");
    localLogout();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const bottomPad = showBottomNav ? "pb-[calc(5rem+env(safe-area-inset-bottom,0px))]" : "pb-6";

  return (
    <div className="app-screen mx-auto w-full max-w-[390px] bg-background relative min-h-screen">
      <header className="shrink-0 z-30 flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur-md border-b border-border/50">
        <button
          type="button"
          data-inline="true"
          onClick={() => setOpen(true)}
          className="btn-inline p-2 -m-2 text-foreground"
          aria-label="תפריט"
        >
          <Menu className="size-6" />
        </button>
        <Logo size={22} />
        <div className="w-10" aria-hidden />
      </header>

      <main className={`px-4 pt-2 ${bottomPad}`}>{children}</main>

      {showBottomNav && (
        <nav className="mobile-bottom-nav border-t border-border bg-secondary/95 backdrop-blur-md">
          <div className="grid grid-cols-4 text-sm">
            {[
              { to: "/dashboard", icon: Home, label: "ראשי" },
              { to: "/control", icon: BarChart3, label: "בקרה" },
              { to: "/notifications", icon: Bell, label: "התראות" },
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
                  style={{ color: active ? "var(--primary)" : "var(--muted-foreground)" }}
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
              <Logo size={24} />
              <button type="button" data-inline="true" onClick={close} className="btn-inline p-2 -m-2" aria-label="סגור">
                <X className="size-5" />
              </button>
            </div>

            <Section title="אזור אישי">
              <MenuLink to="/profile" onClick={close} icon="👤">פרופיל אישי</MenuLink>
              <MenuLink to="/dashboard" onClick={close} icon="🏠">דף הבית</MenuLink>
              <MenuLink to="/leaderboard" onClick={close} icon="🏆">לוח התחסכונות</MenuLink>
              <MenuLink to="/onboarding" onClick={close} icon="📊">הספקים שלי</MenuLink>
              <MenuLink to="/control" onClick={close} icon="💰">לוח בקרה</MenuLink>
              <MenuLink to="/negotiations" onClick={close} icon="🤝">מו״מ פעיל</MenuLink>
              <MenuLink to="/notifications" onClick={close} icon="🔔">התראות</MenuLink>
              <MenuLink to="/add-charge" onClick={close} icon="➕">הוסף חיוב חדש</MenuLink>
            </Section>

            <Section title="תמיכה">
              <MenuLink to="/bank-guide" onClick={close} icon="📋">מדריך הוראות קבע</MenuLink>
              <MenuAnchor href="mailto:support@fixx.ai" icon="💬">צור קשר — support@fixx.ai</MenuAnchor>
              <MenuLink to="/faq" onClick={close} icon="❓">שאלות ותשובות</MenuLink>
              <MenuLink to="/privacy" onClick={close} icon="🔒">מדיניות פרטיות</MenuLink>
              <MenuLink to="/terms" onClick={close} icon="📄">תנאי שימוש</MenuLink>
              <MenuLink to="/disclosure" onClick={close} icon="⚖️">גילוי נאות</MenuLink>
            </Section>

            <Section title="חשבון">
              <button
                type="button"
                onClick={onSignOut}
                className="mobile-full flex items-center gap-3 w-full py-3 text-right min-h-[44px]"
                style={{ color: "var(--danger)" }}
              >
                <span className="w-4 text-center">🚪</span>
                <span className="text-sm">התנתקות</span>
              </button>
              <button
                type="button"
                onClick={onDeleteAccount}
                className="mobile-full flex items-center gap-3 w-full py-3 text-right min-h-[44px] text-sm"
                style={{ color: "var(--danger)" }}
              >
                <span className="w-4 text-center">🗑️</span>
                <span>מחיקת חשבון</span>
              </button>
            </Section>

            <p className="mt-8 text-sm text-muted-foreground text-center">Fixx בע״מ · כל הזכויות שמורות · 2026</p>
          </aside>
        </>
      )}

      <BiometricEnrollPrompt />
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-5">
      <p className="text-sm uppercase tracking-wider mb-2" style={{ color: "var(--muted-foreground)" }}>{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}
function MenuLink({ to, onClick, icon, children }: { to: string; onClick: () => void; icon: ReactNode; children: ReactNode }) {
  return (
    <Link to={to} onClick={onClick} data-inline="true" className="btn-inline flex items-center gap-3 py-3 text-foreground min-h-[44px] text-sm">
      <span className="w-4 text-center">{icon}</span>
      <span>{children}</span>
    </Link>
  );
}
function MenuAnchor({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  return (
    <a href={href} data-inline="true" className="btn-inline flex items-center gap-3 py-3 text-foreground min-h-[44px] text-sm">
      <span className="w-4 text-center">{icon}</span>
      <span>{children}</span>
    </a>
  );
}
