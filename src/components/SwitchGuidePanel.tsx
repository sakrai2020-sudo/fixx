import type { SwitchGuide } from "@/lib/switch-guide";
import { formatCurrency } from "@/lib/format";

export function SwitchGuidePanel({
  guide,
  savingsAmount,
}: {
  guide: SwitchGuide;
  savingsAmount?: number | null;
}) {
  return (
    <div className="glass-card p-4 text-right">
      <p className="text-sm font-bold leading-relaxed">{guide.headline}</p>
      {savingsAmount != null && savingsAmount > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          חיסכון משוער: <span style={{ color: "var(--primary)" }}>{formatCurrency(savingsAmount)}/חודש</span>
          {" "}מול {guide.competitor}
        </p>
      )}
      <ol className="mt-4 space-y-3 list-none pr-0">
        {guide.steps.map((step, i) => (
          <li key={i} className="flex gap-3 items-start text-right">
            <span
              className="shrink-0 size-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "rgba(0,194,168,0.15)", color: "var(--primary)" }}
            >
              {i + 1}
            </span>
            <span className="text-sm leading-relaxed pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
