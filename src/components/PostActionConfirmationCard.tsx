import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import {
  cancelAction,
  confirmAction,
} from "@/lib/action-confirmation.service";
import type { ActionConfirmation } from "@/lib/post-action-confirmation";
import {
  cancelActionConfirmation,
  confirmActionConfirmation,
} from "@/lib/post-action-confirmation.functions";
import { buildProtocolLines, getProtocolTitle } from "@/lib/post-action-confirmation";

type Props = {
  confirmation: ActionConfirmation;
  compact?: boolean;
  onResolved?: (conf: ActionConfirmation) => void;
};

export function PostActionConfirmationCard({ confirmation, compact = false, onResolved }: Props) {
  const runConfirm = useServerFn(confirmActionConfirmation);
  const runCancel = useServerFn(cancelActionConfirmation);
  const [busy, setBusy] = useState<"approve" | "cancel" | null>(null);
  const [conf, setConf] = useState(confirmation);
  const lines = buildProtocolLines(conf);
  const pending = conf.status === "pending";

  const handleApprove = async () => {
    setBusy("approve");
    try {
      const updated = await confirmAction(conf.id, { confirm: runConfirm });
      setConf(updated);
      toast.success("הפעולה אושרה");
      onResolved?.(updated);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "שגיאה באישור");
    } finally {
      setBusy(null);
    }
  };

  const handleCancel = async () => {
    setBusy("cancel");
    try {
      const updated = await cancelAction(conf.id, { cancel: runCancel });
      setConf(updated);
      toast.info("הפעולה בוטלה — בוצע rollback לספק");
      onResolved?.(updated);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "שגיאה בביטול");
    } finally {
      setBusy(null);
    }
  };

  if (!pending && compact) return null;

  return (
    <div
      className={`glass-card border text-right ${compact ? "p-4 mt-4" : "p-5 mt-4"}`}
      style={{ borderColor: "color-mix(in oklab, var(--primary) 35%, var(--border))" }}
    >
      <div className="flex items-start gap-3">
        <div
          className="size-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "color-mix(in oklab, var(--primary) 15%, transparent)", color: "var(--primary)" }}
        >
          <ShieldCheck className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">{getProtocolTitle()}</p>
          <ul className="mt-3 space-y-1.5 text-[13px] text-muted-foreground">
            {lines.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="text-primary shrink-0">✓</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>

          {pending ? (
            <div className={`flex flex-col gap-2.5 ${compact ? "mt-4" : "mt-5"}`}>
              <button
                type="button"
                onClick={handleApprove}
                disabled={!!busy}
                className="w-full rounded-2xl py-3 font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: "#22c55e" }}
              >
                <Check className="size-4" />
                {busy === "approve" ? "מאשר…" : "אני מאשר"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={!!busy}
                className="w-full rounded-2xl py-3 font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: "#ef4444" }}
              >
                <X className="size-4" />
                {busy === "cancel" ? "מבטל…" : "בטל את הפעולה"}
              </button>
              {!compact && (
                <p className="text-[11px] text-muted-foreground text-center">
                  לא אושר תוך 3 ימים — הפעולה תבוטל אוטומטית
                </p>
              )}
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              סטטוס:{" "}
              {conf.status === "confirmed"
                ? "מאושר"
                : conf.status === "cancelled"
                  ? "בוטל"
                  : "פג תוקף"}
            </p>
          )}
        </div>
      </div>

      {compact && pending && (
        <Link
          to="/confirm/$id"
          params={{ id: conf.id }}
          className="mt-3 block text-center text-xs text-primary font-medium"
        >
          פרטים מלאים
        </Link>
      )}
    </div>
  );
}
