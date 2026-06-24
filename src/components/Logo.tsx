const FIXX_ORANGE = "#FF6B00";
const SLOGAN = "הסוכן הפיננסי האוטונומי שלך";
const FONT_FAMILY = '"Heebo", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

function LogoMark({ size, pulseXx = false }: { size: number; pulseXx?: boolean }) {
  return (
    <div
      className="inline-flex items-baseline tracking-tight select-none"
      dir="ltr"
      style={{
        fontSize: size,
        lineHeight: 1,
        fontFamily: FONT_FAMILY,
        fontWeight: 800,
        letterSpacing: "-0.02em",
      }}
      aria-hidden
    >
      <span style={{ color: "#ffffff" }}>Fi</span>
      <span
        className={pulseXx ? "fixx-logo-xx-pulse" : undefined}
        style={{ color: FIXX_ORANGE }}
      >
        xx
      </span>
    </div>
  );
}

function LogoSlogan({ logoSize }: { logoSize: number }) {
  return (
    <p
      dir="rtl"
      className="text-center m-0"
      style={{
        fontSize: Math.max(10, Math.round(logoSize * 0.34)),
        lineHeight: 1.35,
        fontFamily: FONT_FAMILY,
        fontWeight: 500,
        color: "rgba(255, 255, 255, 0.7)",
      }}
    >
      {SLOGAN}
    </p>
  );
}

export function Logo({ size = 52, showSlogan = true }: { size?: number; showSlogan?: boolean }) {
  return (
    <div
      className="inline-flex flex-col items-center gap-1"
      aria-label={showSlogan ? `Fixx — ${SLOGAN}` : "Fixx"}
    >
      <LogoMark size={size} />
      {showSlogan && <LogoSlogan logoSize={size} />}
    </div>
  );
}

export function LogoOrb({ size = 52, showSlogan = true, pulseXx = false }: { size?: number; showSlogan?: boolean; pulseXx?: boolean }) {
  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div className="relative inline-flex items-center justify-center">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(255,107,0,0.35), transparent 70%)",
            boxShadow: "0 0 40px rgba(255,107,0,0.25)",
          }}
        />
        <div
          className="relative rounded-full px-8 py-6"
          style={{ background: "rgba(255,107,0,0.08)", border: "1px solid rgba(255,107,0,0.4)" }}
        >
          <LogoMark size={size} pulseXx={pulseXx} />
        </div>
      </div>
      {showSlogan && <LogoSlogan logoSize={size} />}
    </div>
  );
}
