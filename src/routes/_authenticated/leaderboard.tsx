import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  component: LeaderboardPage,
});

type LeaderboardEntry = {
  rank: number;
  first_name: string;
  city: string;
  total_saved: number;
};

const MEDAL_COLORS: Record<number, { color: string; border: string; bg: string }> = {
  1: { color: "#FFD700", border: "rgba(255,215,0,0.55)", bg: "rgba(255,215,0,0.12)" },
  2: { color: "#C0C0C0", border: "rgba(192,192,192,0.55)", bg: "rgba(192,192,192,0.12)" },
  3: { color: "#CD7F32", border: "rgba(205,127,50,0.55)", bg: "rgba(205,127,50,0.12)" },
};

function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error: rpcErr } = await supabase.rpc("get_monthly_savings_leaderboard");
      if (rpcErr) {
        setError("לא הצלחנו לטעון את לוח ההתחסכונות");
        setEntries([]);
      } else {
        setEntries(
          (data || []).map((row: any) => ({
            rank: Number(row.rank),
            first_name: String(row.first_name || "משתמש"),
            city: String(row.city || "ישראל"),
            total_saved: Number(row.total_saved || 0),
          })),
        );
      }
      setLoading(false);
    })();
  }, []);

  return (
    <AppShell>
      <div className="mt-2 text-center">
        <div
          className="mx-auto size-14 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(0,194,168,0.12)", border: "1px solid rgba(0,194,168,0.35)" }}
        >
          <Trophy className="size-7" style={{ color: "#00C2A8" }} />
        </div>
        <h1 className="mt-4 text-xl font-bold">לוח התחסכונות</h1>
        <p className="mt-1 text-sm text-muted-foreground">40 החוסכים הגדולים · סה״כ חיסכון</p>
        <p className="mt-1 text-[11px] text-muted-foreground">מתעדכן מחדש ב-1 לכל חודש</p>
      </div>

      {loading ? (
        <p className="mt-12 text-center text-sm text-muted-foreground">טוען...</p>
      ) : error ? (
        <p className="mt-12 text-center text-sm text-muted-foreground">{error}</p>
      ) : entries.length === 0 ? (
        <div className="mt-12 text-center text-muted-foreground px-4">
          <p className="text-sm">עדיין אין חוסכים בלוח</p>
          <p className="mt-2 text-[12px]">היה הראשון — התחל מו״מ עם הסוכן</p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-2.5 pb-2">
          {entries.map((entry) => (
            <LeaderboardCard key={entry.rank} entry={entry} />
          ))}
        </div>
      )}

      <p className="mt-6 mb-2 text-center text-[11px] text-muted-foreground leading-relaxed px-2">
        מוצגים שם פרטי, עיר וסכום חיסכון בלבד · ללא פרטי תשלום
      </p>
    </AppShell>
  );
}

function LeaderboardCard({ entry }: { entry: LeaderboardEntry }) {
  const medal = MEDAL_COLORS[entry.rank];
  const isTop3 = entry.rank <= 3;

  return (
    <div
      className="rounded-2xl px-4 py-3.5 flex items-center gap-3"
      style={{
        background: "#111E35",
        border: isTop3 ? `1px solid ${medal.border}` : "1px solid rgba(255,255,255,0.08)",
        transition: "none",
      }}
    >
      <div
        className="size-10 shrink-0 rounded-xl flex items-center justify-center font-bold text-sm"
        style={{
          background: isTop3 ? medal.bg : "rgba(255,255,255,0.06)",
          color: isTop3 ? medal.color : "var(--muted-foreground)",
        }}
      >
        {isTop3 ? (
          <Trophy className="size-5" style={{ color: medal.color }} />
        ) : (
          entry.rank
        )}
      </div>

      <div className="flex-1 min-w-0 text-right">
        <p className="font-semibold text-[15px] truncate">{entry.first_name}</p>
        <p className="text-[12px] text-muted-foreground truncate">{entry.city}</p>
      </div>

      <div className="text-left shrink-0">
        <p className="text-lg font-bold" style={{ color: isTop3 ? medal?.color : "var(--foreground)" }}>
          ₪{Math.round(entry.total_saved).toLocaleString("he-IL")}
        </p>
        <p className="text-[10px] text-muted-foreground">סה״כ חיסכון</p>
      </div>
    </div>
  );
}

export default LeaderboardPage;
