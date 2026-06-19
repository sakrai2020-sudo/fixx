import { ChevronLeft, MapPin } from "lucide-react";
import { getDiscoveryOffers, PLACEHOLDER_USER_AREA, type DiscoveryOffer } from "@/lib/discovery-offers";

export function DiscoveryCard({
  area = PLACEHOLDER_USER_AREA,
  limit = 2,
  className = "",
}: {
  area?: string;
  limit?: number;
  className?: string;
}) {
  const offers = getDiscoveryOffers(area, limit);
  if (offers.length === 0) return null;

  return (
    <div className={`discovery-card ${className}`.trim()}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="discovery-card-title">הצעות נוספות באזורך</p>
        <span className="discovery-card-area">
          <MapPin className="size-3.5 inline-block ml-1 opacity-70" aria-hidden />
          {area}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {offers.map((offer) => (
          <DiscoveryItem key={offer.id} offer={offer} />
        ))}
      </div>
    </div>
  );
}

function DiscoveryItem({ offer }: { offer: DiscoveryOffer }) {
  return (
    <a
      href={offer.url}
      target="_blank"
      rel="noopener noreferrer"
      className="discovery-item"
    >
      <span className="discovery-item-emoji" aria-hidden>
        {offer.emoji}
      </span>
      <span className="flex-1 min-w-0 text-right">
        <span className="discovery-item-title">{offer.title}</span>
        <span className="discovery-item-meta">
          {offer.category} · {offer.description}
        </span>
      </span>
      <ChevronLeft className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </a>
  );
}
