import { MARKETING_BODY, MARKETING_CLOSING, MARKETING_HEADLINE } from "@/lib/marketing-copy";

export function MarketingHero({ className = "" }: { className?: string }) {
  return (
    <div className={`text-center ${className}`}>
      <h1 className="text-xl font-bold leading-snug text-foreground">{MARKETING_HEADLINE}</h1>
      <div className="mt-4 space-y-2 text-sm text-muted-foreground leading-relaxed">
        {MARKETING_BODY.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
      <p className="mt-4 text-sm font-semibold text-foreground">{MARKETING_CLOSING}</p>
    </div>
  );
}
