import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import {
  BRANCHES_REQUIRING_AMOUNT,
  buildRetentionScript,
  RETENTION_BRANCH_LABELS,
  type RetentionBranch,
  type RetentionCallOutcome,
  type RetentionScriptContext,
} from "@/lib/retention-live-assist";

export type RetentionCallResult = {
  outcome: RetentionCallOutcome;
  /** Last monthly price documented during the call (discount / counter branches). */
  offerAmount?: number;
};

export function RetentionLiveAssist({
  context,
  onClose,
  onComplete,
  markCalled,
}: {
  context: RetentionScriptContext;
  onClose: () => void;
  onComplete: (result: RetentionCallResult) => void | Promise<void>;
  markCalled?: () => void | Promise<void>;
}) {
  const script = useMemo(() => buildRetentionScript(context), [context]);
  const [nodeId, setNodeId] = useState("root");
  const [finishStep, setFinishStep] = useState(false);
  const [pendingBranch, setPendingBranch] = useState<RetentionBranch | null>(null);
  const [branchAmount, setBranchAmount] = useState("");
  const [lastOfferAmount, setLastOfferAmount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const node = script[nodeId] ?? script.root;
  const branches = (Object.keys(RETENTION_BRANCH_LABELS) as RetentionBranch[]).filter(
    (key) => node.branches?.[key],
  );

  const advanceBranch = async (branch: RetentionBranch) => {
    const nextId = node.branches?.[branch];
    if (!nextId || !script[nextId]) return;
    if (nodeId === "root" && markCalled) {
      await markCalled();
    }
    setNodeId(nextId);
    setPendingBranch(null);
    setBranchAmount("");
  };

  const goBranch = async (branch: RetentionBranch) => {
    if (!node.branches?.[branch]) return;
    if (BRANCHES_REQUIRING_AMOUNT.includes(branch)) {
      setPendingBranch(branch);
      setBranchAmount(lastOfferAmount != null ? String(lastOfferAmount) : "");
      return;
    }
    await advanceBranch(branch);
  };

  const submitBranchAmount = async () => {
    if (!pendingBranch) return;
    const amt = Number(branchAmount);
    if (!amt || amt <= 0) {
      toast.error("הזן סכום חודשי תקין");
      return;
    }
    setLastOfferAmount(amt);
    await advanceBranch(pendingBranch);
  };

  const submitDecision = async (outcome: RetentionCallOutcome) => {
    if (outcome === "stayed") {
      if (lastOfferAmount == null || lastOfferAmount <= 0) {
        toast.error("תעד כמה הציעו במהלך השיחה (בחירה ב״הציעו הנחה״ או ״הציעו הצעת נגד״)");
        return;
      }
      setBusy(true);
      await onComplete({ outcome, offerAmount: lastOfferAmount });
      setBusy(false);
      return;
    }
    setBusy(true);
    await onComplete({ outcome });
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-black/85">
      <div className="live-assist w-full max-w-[390px] h-full flex flex-col bg-background">
        <header className="live-assist-header px-4 py-3 flex items-center justify-between shrink-0">
          <button
            type="button"
            data-inline="true"
            onClick={onClose}
            className="btn-inline nav-back p-2 -m-2"
            aria-label="סגור"
          >
            <X className="size-5" />
          </button>
          <p className="font-bold text-sm">Live Assist · שיחת שימור</p>
          <div className="w-6" />
        </header>

        {finishStep ? (
          <div className="flex-1 flex flex-col justify-center px-4 py-6">
            <p className="live-assist-outcome-title text-center">מה הוחלט בסוף?</p>
            <p className="text-sm text-muted-foreground text-center mt-2 mb-8">
              Fixx לא מבצעת שיחות — זה סיכום של מה שסוכם עם מחלקת השימור
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => submitDecision("stayed")}
              className="live-assist-branch-btn mb-3"
            >
              נשארתי עם הספק
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => submitDecision("switch")}
              className="live-assist-done-btn"
            >
              אני עדיין רוצה לעבור
            </button>
            {lastOfferAmount != null && lastOfferAmount > 0 && (
              <p className="text-xs text-muted-foreground text-center mt-4">
                סכום שתועד: ₪{Math.round(lastOfferAmount).toLocaleString("he-IL")}/חודש
              </p>
            )}
            <button
              type="button"
              onClick={() => setFinishStep(false)}
              className="live-assist-back-link mt-6"
            >
              חזרה לתסריט
            </button>
          </div>
        ) : pendingBranch ? (
          <div className="flex-1 flex flex-col justify-center px-4 py-6">
            <p className="live-assist-outcome-title text-center">כמה הציעו בפועל?</p>
            <p className="text-sm text-muted-foreground text-center mt-2 mb-6">
              לפני שממשיכים — תעד את הסכום שהנציג הציע
            </p>
            <div className="glass-card p-4 flex flex-col gap-3">
              <label className="text-sm font-semibold text-right" htmlFor="live-assist-branch-amount">
                סכום חודשי (₪)
              </label>
              <input
                id="live-assist-branch-amount"
                type="number"
                inputMode="numeric"
                dir="ltr"
                value={branchAmount}
                onChange={(e) => setBranchAmount(e.target.value)}
                placeholder="₪___"
                className="live-assist-input w-full"
                autoFocus
              />
              <button
                type="button"
                onClick={submitBranchAmount}
                className="w-full rounded-[16px] bg-primary text-primary-foreground font-bold py-3.5 teal-glow"
              >
                המשך לתגובה הבאה
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setPendingBranch(null);
                setBranchAmount("");
              }}
              className="live-assist-back-link mt-6"
            >
              חזרה לתסריט
            </button>
          </div>
        ) : (
          <>
            <div className="live-assist-body flex-1 min-h-0 flex flex-col justify-center px-5 py-6">
              <p className="live-assist-label">{node.label}</p>
              <p className="live-assist-script" key={node.id}>
                &quot;{node.text}&quot;
              </p>
              <p className="live-assist-tip">📞 קרא את המשפט בקול — הסוכן יעדכן לפי תגובת הנציג</p>
            </div>

            <div className="live-assist-actions px-4 pb-3 flex flex-col gap-2.5 shrink-0">
              {branches.map((branch) => (
                <button
                  key={branch}
                  type="button"
                  onClick={() => goBranch(branch)}
                  className="live-assist-branch-btn"
                >
                  {RETENTION_BRANCH_LABELS[branch]}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setFinishStep(true)}
                className="live-assist-done-btn"
              >
                סיימתי את השיחה
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
