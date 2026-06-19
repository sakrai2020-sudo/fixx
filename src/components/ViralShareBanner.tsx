import { X } from "lucide-react";
import {
  buildViralBannerHeadline,
  openWhatsAppShare,
  VIRAL_BANNER_SUBTITLE,
} from "@/lib/whatsapp-share";

export function ViralShareBanner({
  amount,
  onDismiss,
}: {
  amount: number;
  onDismiss: () => void;
}) {
  return (
    <div
      className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] left-1/2 z-30 w-full max-w-[390px] -translate-x-1/2 px-4"
      style={{ transition: "none" }}
    >
      <div
        dir="rtl"
        className="relative rounded-2xl px-4 py-3.5 shadow-lg"
        style={{
          background: "rgba(0,194,168,0.14)",
          border: "1px solid rgba(0,194,168,0.45)",
          direction: "rtl",
          textAlign: "right",
        }}
      >
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-2 left-2 p-1 text-white/50"
          aria-label="סגור"
        >
          <X className="size-4" />
        </button>

        <div style={{ direction: "rtl", textAlign: "right" }}>
          <p className="text-[15px] font-bold leading-snug text-white">
            {buildViralBannerHeadline(amount)}
          </p>
          <p className="mt-1.5 text-[13px] leading-snug text-white/85">
            {VIRAL_BANNER_SUBTITLE}
          </p>
        </div>

        <button
          type="button"
          onClick={() => openWhatsAppShare(amount)}
          className="mt-3 w-full rounded-xl py-2.5 text-[13px] font-bold text-[#0B1628]"
          style={{ background: "#00C2A8", transition: "none", direction: "rtl" }}
        >
          שיתוף →
        </button>
      </div>
    </div>
  );
}
