import { Share2 } from "lucide-react";
import { DiscoveryCard } from "@/components/DiscoveryCard";
import { openWhatsAppShare } from "@/lib/whatsapp-share";

export function ShareSavingsButton({
  annualSavings,
  className,
}: {
  annualSavings: number;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => openWhatsAppShare(annualSavings)}
      className={
        className ??
        "w-full rounded-[20px] border font-bold py-4 flex items-center justify-center gap-2"
      }
      style={{
        borderColor: "#25D366",
        color: "#25D366",
        transition: "none",
      }}
    >
      <Share2 className="size-5" />
      שתף ב-WhatsApp
    </button>
  );
}

export function SavingsSuccessPanel({
  annualSavings,
  headline,
  subtitle,
  onContinue,
  continueLabel = "המשך לדף הבית",
}: {
  annualSavings: number;
  headline: string;
  subtitle?: string;
  onContinue: () => void;
  continueLabel?: string;
}) {
  return (
    <div className="mt-8 flex flex-col items-center text-center px-2">
      <div
        className="size-16 rounded-full flex items-center justify-center text-3xl"
        style={{ background: "rgba(0,194,168,0.15)" }}
      >
        🏆
      </div>
      <h2 className="mt-5 text-xl font-bold">{headline}</h2>
      <p className="mt-2 text-3xl font-bold" style={{ color: "var(--primary)" }}>
        ₪{Math.round(annualSavings).toLocaleString("he-IL")}
      </p>
      <p className="text-sm text-muted-foreground">חיסכון שנתי נטו</p>
      {subtitle ? <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{subtitle}</p> : null}
      <DiscoveryCard className="mt-8 w-full text-right" limit={2} />
      <div className="mt-5 w-full flex flex-col gap-3">
        <ShareSavingsButton annualSavings={annualSavings} />
        <button
          type="button"
          onClick={onContinue}
          className="w-full rounded-[20px] bg-primary text-primary-foreground font-bold py-4 teal-glow"
          style={{ transition: "none" }}
        >
          {continueLabel}
        </button>
      </div>
    </div>
  );
}
