import { ExternalLink } from "lucide-react";
import {
  getProviderRegistrationUrl,
  getRegistrationSteps,
} from "@/lib/provider-registration";

export function ProviderRegistrationPanel({
  fromProvider,
  toProvider,
  planName,
  onComplete,
  busy,
}: {
  fromProvider: string;
  toProvider: string;
  planName: string;
  onComplete: () => void;
  busy?: boolean;
}) {
  const steps = getRegistrationSteps(fromProvider, toProvider, planName);
  const registrationUrl = getProviderRegistrationUrl(toProvider);

  return (
    <div className="mt-6 flex flex-col gap-5">
      <div className="glass-card p-4 text-right">
        <p className="text-sm font-bold leading-relaxed">
          כמעט סיימנו — השלב הבא אצל {toProvider}
        </p>
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
          ההצעה אושרה. כדי שהחיסכון ייכנס לתוקף, השלם את ההרשמה אצל הספק החדש.
        </p>
        <ol className="mt-4 space-y-3 list-none pr-0">
          {steps.map((step, i) => (
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

      <a
        href={registrationUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full rounded-[20px] bg-primary text-primary-foreground font-bold py-4 flex items-center justify-center gap-2 teal-glow"
      >
        <ExternalLink className="size-4" />
        עבור להרשמה ב-{toProvider}
      </a>

      <button
        type="button"
        disabled={busy}
        onClick={onComplete}
        className="w-full rounded-[20px] border font-bold py-4 disabled:opacity-50"
        style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
      >
        {busy ? "שומר…" : "סיימתי את ההרשמה ✓"}
      </button>
    </div>
  );
}
