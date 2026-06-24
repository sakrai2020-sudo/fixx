import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Bot, PhoneOff, Handshake, ArrowLeft } from "lucide-react";
import { LogoOrb } from "@/components/Logo";
import { MarketingHero } from "@/components/MarketingHero";
import { MARKETING_HIGHLIGHTS } from "@/lib/marketing-copy";
import { useAuth } from "@/lib/auth";
import { loadingOverlay } from "@/lib/loading-overlay";
import { resolvePostLoginPath } from "@/lib/account-type";

export const Route = createFileRoute("/")({
  component: Splash,
});

function Splash() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    loadingOverlay.show();
    if (!user) {
      navigate({ to: "/auth", replace: true });
      return;
    }
    resolvePostLoginPath(user.id, "local").then((path) => {
      navigate({ to: path as "/dashboard" | "/business-dashboard" | "/business-onboarding", replace: true });
    });
  }, [loading, user, navigate]);

  const icons = [PhoneOff, Handshake, Bot];
  const cards = MARKETING_HIGHLIGHTS.map((c, i) => ({ ...c, icon: icons[i] ?? Bot }));

  return (
    <div className="app-screen w-full min-h-screen px-5 py-6" style={{ opacity: 1, transition: "none" }}>
      <div className="flex flex-col">
        <div className="flex flex-col items-center text-center mt-4 mb-8">
          <LogoOrb size={52} pulseXx />
          <div className="mt-6">
            <MarketingHero />
          </div>
        </div>

        <div className="flex flex-col gap-3 mb-8">
          {cards.map((c, i) => (
            <div key={i} className="glass-card p-4 flex items-center gap-4">
              <div className="shrink-0 size-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,194,168,0.12)", border: "1px solid rgba(0,194,168,0.3)" }}>
                <c.icon className="size-5" style={{ color: "var(--teal)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{c.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{c.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto pb-4">
          <Link to="/auth" className="mobile-full w-full min-h-11 rounded-xl btn-cta font-bold text-sm flex items-center justify-center gap-2 cta-glow">
            בואו נתחיל <ArrowLeft className="size-4" />
          </Link>
          <p className="text-center text-sm text-muted-foreground mt-3">
            ✓ {MARKETING_HIGHLIGHTS[2].text} — באישורך בלבד
          </p>
        </div>
      </div>
    </div>
  );
}
