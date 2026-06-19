export type RetentionScriptContext = {
  providerName: string;
  competitorName: string;
  competitorPrice: number;
  currentPrice: number;
};

export type RetentionBranch = "discount" | "refuse" | "counter";

export type RetentionScriptNode = {
  id: string;
  label: string;
  text: string;
  branches?: Partial<Record<RetentionBranch, string>>;
};

export const RETENTION_BRANCH_LABELS: Record<RetentionBranch, string> = {
  discount: "הציעו הנחה",
  refuse: "סירבו",
  counter: "הציעו הצעת נגד",
};

export function buildRetentionScript(ctx: RetentionScriptContext): Record<string, RetentionScriptNode> {
  const comp = Math.round(ctx.competitorPrice) || Math.max(1, Math.round(ctx.currentPrice * 0.8));
  const orig = Math.round(ctx.currentPrice);
  const target = Math.max(comp, Math.round(orig * 0.85));

  return {
    root: {
      id: "root",
      label: "משפט פתיחה",
      text: `קיבלתי הצעה מ-${ctx.competitorName} ב-₪${comp} לחודש לאותה חבילה.`,
      branches: {
        discount: "discount_1",
        refuse: "refuse_1",
        counter: "counter_1",
      },
    },
    discount_1: {
      id: "discount_1",
      label: "כשמציעים הנחה",
      text: `תודה, אבל זה עדיין לא משתלם מול ${ctx.competitorName}. מה המחיר הכי נמוך שאתם יכולים לתת?`,
      branches: {
        discount: "discount_2",
        refuse: "refuse_2",
        counter: "counter_1",
      },
    },
    discount_2: {
      id: "discount_2",
      label: "אם ההנחה עדיין לא מספיקה",
      text: `אני צריך לרדת ל-₪${target} לפחות כדי להישאר. אם לא — אני מאשר את המעבר.`,
      branches: {
        refuse: "refuse_2",
        counter: "counter_2",
      },
    },
    refuse_1: {
      id: "refuse_1",
      label: "כשסירבו לשפר",
      text: `אני מבין. אז אני אאשר את המעבר ל-${ctx.competitorName} היום — אלא אם תשוו את ההצעה.`,
      branches: {
        discount: "discount_1",
        counter: "counter_1",
      },
    },
    refuse_2: {
      id: "refuse_2",
      label: "סגירה נחרצת",
      text: `תודה על השיחה. אני מעדכן את הסוכן שלי וממשיך בתהליך המעבר.`,
    },
    counter_1: {
      id: "counter_1",
      label: "הצעת נגד",
      text: `${ctx.competitorName} מציע ₪${comp} עם אותה חבילה. תוכלו להשתוות או לשפר?`,
      branches: {
        discount: "discount_1",
        refuse: "refuse_1",
        counter: "counter_2",
      },
    },
    counter_2: {
      id: "counter_2",
      label: "לחץ על ההצעה",
      text: `אני מחכה לתשובה סופית עכשיו — אחרת אני חותם עם ${ctx.competitorName}.`,
      branches: {
        discount: "discount_2",
        refuse: "refuse_2",
      },
    },
  };
}

export type RetentionCallOutcome = "stayed" | "switch";

/** Branches that require documenting the rep's actual offer before advancing. */
export const BRANCHES_REQUIRING_AMOUNT: RetentionBranch[] = ["discount", "counter"];
