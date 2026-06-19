import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { CATEGORIES } from "@/lib/categories";
import { appendQuickAddCharge } from "@/lib/local-providers";

export const Route = createFileRoute("/_authenticated/add-charge")({
  component: AddCharge,
});

function AddCharge() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<string | null>(null);
  const [range, setRange] = useState<string | null>(null);

  const meta = CATEGORIES.find((c) => c.name === category);

  const save = () => {
    if (!category || !range) {
      toast.error("בחר קטגוריה וטווח מחיר");
      return;
    }
    appendQuickAddCharge(category, range);
    toast.success(`${category} נוסף בהצלחה`);
    navigate({ to: "/dashboard" });
  };

  return (
    <AppShell showBottomNav={false}>
      <Link to="/dashboard" data-inline="true" className="nav-back btn-inline mt-2 flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronRight className="size-4" /> חזרה
      </Link>

      <h1 className="text-2xl font-bold mt-4">הוסף חיוב חדש</h1>
      <p className="text-sm text-muted-foreground mt-1">בחר קטגוריה אחת וטווח מחיר — בלי לעבור על כל השאלון</p>

      <p className="mt-6 text-sm font-semibold">קטגוריה</p>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {CATEGORIES.map((c) => {
          const on = category === c.name;
          return (
            <button
              key={c.name}
              type="button"
              onClick={() => {
                setCategory(c.name);
                setRange(null);
              }}
              className={
                "glass-card text-right p-3 flex items-center gap-2 transition-all " +
                (c.full ? "col-span-2 " : "") +
                (on ? "ring-2 teal-glow" : "")
              }
              style={
                on
                  ? {
                      borderColor: "var(--primary)",
                      boxShadow: "0 0 0 1px var(--primary), 0 0 24px -8px var(--primary)",
                    }
                  : undefined
              }
            >
              <span className="text-xl">{c.emoji}</span>
              <span className="text-[13px] font-medium leading-tight">{c.name}</span>
            </button>
          );
        })}
      </div>

      {meta && (
        <div className="mt-6 glass-card p-4">
          <p className="text-sm font-semibold mb-3">
            {meta.emoji} {meta.name} — בחר טווח
          </p>
          <div className="flex flex-wrap gap-2">
            {meta.ranges.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className="rounded-full px-3 py-2 text-sm border min-h-[36px] transition-colors"
                style={
                  range === r
                    ? {
                        background: "var(--primary)",
                        color: "var(--primary-foreground)",
                        borderColor: "var(--primary)",
                      }
                    : { borderColor: "var(--border)", color: "var(--muted-foreground)" }
                }
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={save}
        disabled={!category || !range}
        className="mt-6 w-full rounded-[20px] bg-primary text-primary-foreground font-bold py-4 teal-glow disabled:opacity-50"
      >
        הוסף חיוב
      </button>
    </AppShell>
  );
}
