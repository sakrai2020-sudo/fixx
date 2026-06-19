export type DiscoveryOffer = {
  id: string;
  emoji: string;
  title: string;
  category: string;
  area: string;
  description: string;
  url: string;
};

/** Placeholder until CPL / geo API is wired. Replace `DISCOVERY_PLACEHOLDER` with fetch. */
export const PLACEHOLDER_USER_AREA = "תל אביב";

const DISCOVERY_PLACEHOLDER: DiscoveryOffer[] = [
  {
    id: "disc-gym-1",
    emoji: "💪",
    title: "Holmes Place — תל אביב",
    category: "כושר",
    area: "תל אביב",
    description: "חודש ראשון ב-₪99 · מנוי שנתי גמיש",
    url: "https://www.holmesplace.co.il/",
  },
  {
    id: "disc-kids-1",
    emoji: "👶",
    title: "מכבי — חוג כדורגל",
    category: "חוגים",
    area: "תל אביב",
    description: "מתחיל מ-₪180/חודש · גילאי 6–12",
    url: "https://www.maccabi4u.co.il/",
  },
  {
    id: "disc-security-1",
    emoji: "🔒",
    title: "שח\"ל — חבילת אבטחה",
    category: "אבטחה",
    area: "תל אביב",
    description: "התקנה + ₪79/חודש · ללא התחייבות",
    url: "https://www.shahal.co.il/",
  },
  {
    id: "disc-gym-2",
    emoji: "💪",
    title: "אייקון — מנוי Basic",
    category: "כושר",
    area: "חיפה",
    description: "₪129/חודש · גישה לכל הסניפים",
    url: "https://www.icon.co.il/",
  },
];

export function getDiscoveryOffers(area: string = PLACEHOLDER_USER_AREA, limit = 2): DiscoveryOffer[] {
  const inArea = DISCOVERY_PLACEHOLDER.filter((o) => o.area === area);
  const pool = inArea.length >= limit ? inArea : [...inArea, ...DISCOVERY_PLACEHOLDER.filter((o) => o.area !== area)];
  return pool.slice(0, limit);
}
