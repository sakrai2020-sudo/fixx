import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { getAuthUserOrLocal } from "@/lib/auth-session";
import { createLocalNegotiation } from "@/lib/local-negotiations";
import { sendNegotiationEmail } from "@/lib/negotiation-email.functions";
import { defaultCompetitorForCategory } from "@/lib/negotiation-email";
import { getSwitchGuide, usesSwitchGuide } from "@/lib/switch-guide";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type Provider = {
  id: string;
  provider_name: string;
  monthly_price?: number | null;
  category?: string | null;
  plan_name?: string | null;
};

type GoalOption = {
  value: string;
  label: string;
  emoji: string;
};

type CategoryConfig = {
  goals: GoalOption[];
  placeholder: string;
};

const DEFAULT_CONFIG: CategoryConfig = {
  goals: [
    { value: "price", label: "הורד לי את המחיר", emoji: "🎯" },
    { value: "alternative", label: "בדוק אם יש חלופה זולה", emoji: "🔍" },
    { value: "cancel", label: "בטל שירות", emoji: "🚫" },
  ],
  placeholder: "תאר את השירות שאתה רוצה לטפל בו",
};

const CATEGORY_CONFIGS: { match: string[]; config: CategoryConfig }[] = [
  {
    match: ["סלולר"],
    config: {
      goals: [
        { value: "price", label: "הורד לי את המחיר", emoji: "🎯" },
        { value: "upgrade", label: "שדרג את החבילה שלי", emoji: "📶" },
        { value: "downgrade", label: "צמצם חבילה לחיסכון", emoji: "💰" },
      ],
      placeholder: "לדוגמא: אני רוצה יותר דקות / לצמצם דקות / לבטל קו",
    },
  },
  {
    match: ["טלוויזיה ואינטרנט", "תקשורת", "טלוויזיה", "אינטרנט"],
    config: {
      goals: [
        { value: "price", label: "הורד לי את המחיר", emoji: "🎯" },
        { value: "upgrade_speed", label: "שדרג מהירות אינטרנט", emoji: "⚡" },
        { value: "channels", label: "הוסף/הסר ערוצים", emoji: "📺" },
      ],
      placeholder: "לדוגמא: אני רוצה להוסיף ערוצי ספורט / לשדרג לפייבר / להסיר חבילה",
    },
  },
  {
    match: ["חברת חשמל", "חשמל"],
    config: {
      goals: [
        { value: "switch_provider", label: "עבור לספק זול יותר", emoji: "🔌" },
        { value: "discount_plan", label: "שנה מסלול הנחה", emoji: "⚡" },
        { value: "better_discount", label: "בדוק אם יש הנחה טובה יותר", emoji: "🔍" },
      ],
      placeholder: "לדוגמא: אני רוצה הנחת לילה / לעבור לסלקום חשמל / לבדוק מסלול סופ״ש",
    },
  },
  {
    match: ["ביטוח רכב"],
    config: {
      goals: [
        { value: "price", label: "הורד לי את הפרמיה", emoji: "🎯" },
        { value: "change_plan", label: "שנה מסלול ביטוח", emoji: "🚗" },
        { value: "competitors", label: "בדוק הצעות מתחרות", emoji: "🔍" },
      ],
      placeholder: "לדוגמא: אין לי תביעות 3 שנים / רוצה להוריד השתתפות עצמית",
    },
  },
  {
    match: ["ביטוח חיים", "ביטוח בריאות", "ביטוח חיים/בריאות"],
    config: {
      goals: [
        { value: "price", label: "הורד לי את הפרמיה", emoji: "🎯" },
        { value: "overlap", label: "בדוק כפל ביטוחי", emoji: "❤️" },
        { value: "change_cover", label: "שנה מסלול כיסוי", emoji: "🔍" },
      ],
      placeholder: "לדוגמא: אני רוצה לבדוק אם יש כפל ביטוח / להוריד כיסוי",
    },
  },
  {
    match: ["ביטוח דירה", "ביטוח תכולה", "ביטוח דירה/תכולה"],
    config: {
      goals: [
        { value: "price", label: "הורד לי את הפרמיה", emoji: "🎯" },
        { value: "update_value", label: "עדכן שווי תכולה", emoji: "🏠" },
        { value: "competitors", label: "בדוק הצעות מתחרות", emoji: "🔍" },
      ],
      placeholder: "לדוגמא: התכולה שלי שווה פחות / רוצה להוריד פרמיה",
    },
  },
  {
    match: ["קופת חולים"],
    config: {
      goals: [
        { value: "upgrade_plan", label: "שדרג מסלול שב״ן", emoji: "🏥" },
        { value: "downgrade_plan", label: "שנמך מסלול לחיסכון", emoji: "💰" },
        { value: "check_plan", label: "בדוק מה כלול במסלול שלי", emoji: "🔍" },
      ],
      placeholder: "לדוגמא: אני רוצה לשדרג לזהב / לבדוק אם המסלול הנוכחי כדאי",
    },
  },
  {
    match: ["מועדון כושר"],
    config: {
      goals: [
        { value: "price", label: "הורד לי את המחיר", emoji: "🎯" },
        { value: "freeze", label: "הקפא מנוי", emoji: "❄️" },
        { value: "cancel_search", label: "בטל וחפש מועדון זול יותר", emoji: "🔍" },
      ],
      placeholder: "לדוגמא: אני רוצה להקפיא חודש / לבטל / למצוא מועדון קרוב יותר",
    },
  },
  {
    match: ["סטרימינג"],
    config: {
      goals: [
        { value: "price", label: "הורד לי את המחיר", emoji: "🎯" },
        { value: "downgrade", label: "שנמך מסלול", emoji: "📱" },
        { value: "cancel", label: "בטל מנוי", emoji: "🚫" },
      ],
      placeholder: "לדוגמא: אני רוצה מסלול זול יותר / לבטל נטפליקס",
    },
  },
  {
    match: ["חוגי ילדים"],
    config: {
      goals: [
        { value: "price", label: "הורד לי את המחיר", emoji: "🎯" },
        { value: "find_cheaper", label: "בדוק חוגים זולים יותר באזורי", emoji: "🔍" },
        { value: "cancel", label: "בטל חוג", emoji: "🚫" },
      ],
      placeholder: "לדוגמא: אני רוצה להוריד מחיר / למצוא חוג דומה זול יותר",
    },
  },
  {
    match: ["אבטחה ומיגון"],
    config: {
      goals: [
        { value: "price", label: "הורד לי את המחיר", emoji: "🎯" },
        { value: "upgrade_equipment", label: "שדרג ציוד", emoji: "🔒" },
        { value: "switch_company", label: "בטל ועבור לחברה אחרת", emoji: "🔍" },
      ],
      placeholder: "לדוגמא: אני רוצה להוריד דמי ניטור / לשדרג מצלמות",
    },
  },
  {
    match: ["ברי מים"],
    config: {
      goals: [
        { value: "price", label: "הורד לי את המחיר", emoji: "🎯" },
        { value: "replace_model", label: "החלף דגם", emoji: "💧" },
        { value: "switch_provider", label: "בטל ועבור לספק אחר", emoji: "🔍" },
      ],
      placeholder: "לדוגמא: אני רוצה בר מים תת-כיורי / להוריד דמי שכירות",
    },
  },
  {
    match: ["ניקיון וגינון"],
    config: {
      goals: [
        { value: "price", label: "הורד לי את המחיר", emoji: "🎯" },
        { value: "change_frequency", label: "שנה תדירות", emoji: "🧹" },
        { value: "find_cheaper", label: "בדוק נותני שירות זולים יותר", emoji: "🔍" },
      ],
      placeholder: "לדוגמא: אני רוצה פעם בשבועיים במקום כל שבוע",
    },
  },
  {
    match: ["ועד בניין"],
    config: {
      goals: [
        { value: "check_amount", label: "בדוק אם הסכום תקין", emoji: "🏢" },
        { value: "appeal", label: "ערער על חיוב", emoji: "📋" },
        { value: "detail", label: "בקש פירוט הוצאות", emoji: "🔍" },
      ],
      placeholder: "לדוגמא: המחיר עלה בלי הסבר / אני רוצה לראות דוח הוצאות",
    },
  },
];

function getCategoryConfig(category?: string | null): CategoryConfig {
  if (!category) return DEFAULT_CONFIG;
  const normalized = category.trim();
  for (const entry of CATEGORY_CONFIGS) {
    if (entry.match.includes(normalized)) return entry.config;
  }
  return DEFAULT_CONFIG;
}

export function ProviderActionSheet({
  provider,
  open,
  onOpenChange,
}: {
  provider: Provider | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const navigate = useNavigate();
  const dispatchNegotiationEmail = useServerFn(sendNegotiationEmail);
  const config = getCategoryConfig(provider?.category);
  const [goal, setGoal] = useState<string>(config.goals[0].value);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset goal when provider/category changes
  useEffect(() => {
    setGoal(config.goals[0].value);
  }, [provider?.category]);

  const confirm = async () => {
    if (!provider) return;
    setLoading(true);
    try {
      const user = await getAuthUserOrLocal();
      const isSwitch = usesSwitchGuide(provider.category);

      if (user.source === "local") {
        const neg = createLocalNegotiation({
          userId: user.id,
          provider: {
            id: provider.id,
            provider_name: provider.provider_name,
            monthly_price: provider.monthly_price,
            category: provider.category,
            plan_name: provider.plan_name || "חבילה נוכחית",
          },
          goal,
          note: note.trim() || undefined,
        });
        onOpenChange(false);
        setNote("");
        setGoal(config.goals[0].value);
        toast.success(isSwitch ? "הסוכן מצא את ההצעה הטובה ביותר — הנה הצעדים" : "הסוכן שלח פנייה לספק");
        navigate({ to: "/negotiation/$id", params: { id: neg.id } });
        return;
      }

      const deadline = new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString();
      const { data: neg } = await supabase
        .from("negotiations")
        .insert({
          user_id: user.id,
          user_provider_id: provider.id,
          status: "active",
          deadline,
          recommendation_type: goal,
        })
        .select()
        .single();
      if (!neg) return;
      const base = Number(provider.monthly_price || 100);
      const competitor = defaultCompetitorForCategory(provider.category);
      const cheapestPrice = Math.round(base * 0.7);
      await supabase.from("offers").insert([
        { negotiation_id: neg.id, offer_type: "cheapest", provider_name: competitor, plan_name: "חבילה חסכונית", monthly_price: cheapestPrice, features: ["שיחות וטקסטים ללא הגבלה", "2GB גלישה"] },
        { negotiation_id: neg.id, offer_type: "value", provider_name: competitor, plan_name: "החבילה המומלצת", monthly_price: Math.round(base * 0.78), features: ["שיחות ללא הגבלה", "30GB גלישה", "שירות לקוחות VIP"] },
        { negotiation_id: neg.id, offer_type: "premium", provider_name: competitor, plan_name: "פרמיום", monthly_price: Math.round(base * 0.92), features: ["ללא הגבלה", "100GB+", "בונוסים נוספים", "שירות VIP 24/7"] },
      ]);

      if (isSwitch) {
        try {
          sessionStorage.setItem(
            `neg-guide-${neg.id}`,
            JSON.stringify(getSwitchGuide(provider.category || "", provider.provider_name, competitor)),
          );
        } catch {}
        toast.success("הסוכן מצא את ההצעה הטובה ביותר — הנה הצעדים");
      } else {
        try {
          await dispatchNegotiationEmail({ data: { negotiationId: neg.id } });
          toast.success("הסוכן שלח פנייה לספק");
        } catch (emailErr: unknown) {
          console.error(emailErr);
          toast.error("המו״מ נוצר — שליחת האימייל תושלם בהמשך");
        }
      }
      try {
        if (note.trim()) sessionStorage.setItem(`neg-note-${neg.id}`, note.trim());
      } catch {}
      onOpenChange(false);
      setNote("");
      setGoal(config.goals[0].value);
      navigate({ to: "/negotiation/$id", params: { id: neg.id } });
    } finally {
      setLoading(false);
    }
  };

  if (!open || !provider) return null;

  return (
    <Sheet
      open
      onOpenChange={(next) => {
        if (!next) {
          onOpenChange(false);
          setNote("");
          setGoal(config.goals[0].value);
        }
      }}
    >
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-border bg-card max-h-[90vh] overflow-y-auto max-w-[390px] mx-auto left-1/2 -translate-x-1/2"
        overlayClassName="!opacity-100"
        overlayStyle={{ backgroundColor: "rgba(11, 22, 40, 0.95)" }}
      >
        <SheetHeader className="text-right">
          <SheetTitle>על מה לעבוד?</SheetTitle>
          <SheetDescription>
            הסוכן יתחיל לעבוד על {provider?.provider_name || "הספק"} מיד
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 flex flex-col gap-2.5">
          {config.goals.map((g) => (
            <GoalPill
              key={g.value}
              emoji={g.emoji}
              label={g.label}
              active={goal === g.value}
              onClick={() => setGoal(g.value)}
            />
          ))}
        </div>

        <div className="mt-5">
          <label className="text-xs text-muted-foreground">הוסף הוראה ספציפית (אופציונלי)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={config.placeholder}
            rows={3}
            className="mt-1.5 w-full rounded-xl bg-secondary border border-border p-3 text-sm text-right resize-none focus:outline-none focus:border-[var(--primary)]"
          />
        </div>

        <button
          type="button"
          onClick={confirm}
          disabled={loading}
          aria-busy={loading}
          className="mt-5 w-full rounded-2xl py-3.5 font-semibold text-white disabled:opacity-60 btn-primary flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              הסוכן מתחיל…
            </>
          ) : (
            "הסוכן מתחיל לעבוד ←"
          )}
        </button>
      </SheetContent>
    </Sheet>
  );
}

function GoalPill({ emoji, label, active, onClick }: { emoji: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl px-4 py-3.5 flex items-center gap-3 text-right border transition-all"
      style={{
        background: active ? "rgba(0,194,168,0.15)" : "rgba(255,255,255,0.04)",
        borderColor: active ? "var(--primary)" : "var(--border)",
      }}
    >
      <span className="text-xl">{emoji}</span>
      <span className="flex-1 font-medium text-sm">{label}</span>
    </button>
  );
}
