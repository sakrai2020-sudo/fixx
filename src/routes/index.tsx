import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Bot, Coins, Zap, ArrowLeft } from "lucide-react";
import { LogoOrb } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { loadingOverlay } from "@/lib/loading-overlay";

export const Route = createFileRoute("/")({
  component: Splash,
});

function Splash() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    loadingOverlay.show();
    navigate({ to: user ? "/dashboard" : "/auth", replace: true });
  }, [loading, user, navigate]);

  const cards = [
    { icon: Bot, title: "סוכן פיננסי אוטונומי", text: "פועל בשבילך ברקע, ללא מאמץ מצדך" },
    { icon: Coins, title: "חוסך לך אלפי שקלים בשנה", text: "סלולר, תקשורת, ביטוח, כושר ועוד" },
    { icon: Zap, title: "פעיל 24/7 ברקע", text: "מתריע לפני עליית מחיר, מנהל מו״מ אוטומטי" },
  ];

  return (
    <div className="app-screen w-full min-h-screen px-5 py-6" style={{ opacity: 1, transition: "none" }}>
      <div className="flex flex-col">
        <div className="flex flex-col items-center text-center mt-4 mb-8">
          <LogoOrb size={52} />
          <h1 className="mt-6 text-2xl font-bold leading-tight">הסוכן שמנהל את החשבונות בשבילך</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            משווה הצעות מחיר, מנהל מו״מ מול ספקים — וסוגר בשבילך את המחיר הטוב ביותר
          </p>
        </div>

        <div className="flex flex-col gap-3 mb-8">
          {cards.map((c, i) => (
            <div key={i} className="glass-card p-4 flex items-center gap-4">
              <div className="shrink-0 size-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(0,194,168,0.12)", border: "1px solid rgba(0,194,168,0.3)" }}>
                <c.icon className="size-5" style={{ color: "var(--primary)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{c.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{c.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto pb-4">
          <Link to="/auth" className="mobile-full w-full min-h-11 rounded-[20px] bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 teal-glow">
            בואו נתחיל <ArrowLeft className="size-4" />
          </Link>
          <p className="text-center text-sm text-muted-foreground mt-3">
            ✓ הסוכן עובר בין ספקים באישור המשתמש בלבד
          </p>
        </div>
      </div>
    </div>
  );
}
