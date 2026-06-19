import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ChevronDown, Search, Mail } from "lucide-react";

export const Route = createFileRoute("/_authenticated/faq")({
  component: FaqPage,
});

type QA = { q: string; a: string };
type Section = { title: string; items: QA[] };

const SECTIONS: Section[] = [
  {
    title: "על השירות",
    items: [
      { q: "איך Fixx עובד?", a: "Fixx סורק את כל החבילות שלך, מזהה הזדמנויות לחיסכון, ומנהל מו״מ אוטומטי מול הספקים בשמך. אתה מקבל עדכון על כל פעולה — ולא מתבצע שום שינוי בלי האישור שלך." },
      { q: "האם השירות בחינם?", a: "כן. Fixx חינמי לחלוטין בתקופת ההשקה. אין עלויות נסתרות ואין הפתעות." },
      { q: "עם אילו ספקים Fixx עובד?", a: "Fixx עובד עם מגוון רחב של ספקים ישראלים — תקשורת, ביטוח, חשמל, כושר, סטרימינג, ברי מים ועוד. הרשימה מתרחבת כל הזמן." },
      { q: "כמה זמן לוקח המו״מ?", a: "רוב המו״מים מסתיימים תוך 3-7 ימים. הסוכן שולח פנייה ביום הראשון, מנתח תגובות ביום השני, ומציג לך המלצה סופית ביום השלישי." },
    ],
  },
  {
    title: "פרטיות ואבטחה",
    items: [
      { q: "האם Fixx רואה את פרטי חשבון הבנק שלי?", a: "לא. Fixx לא מתחבר לחשבון הבנק שלך ולא רואה פרטי כרטיס אשראי. המידע היחיד שאנחנו אוספים הוא שם הספק והסכום שאתה משלם." },
      { q: "מה קורה לצילומי המסך שאני מעלה?", a: "הצילום מעובד מיד לצורך זיהוי החיובים ונמחק לאחר מכן. Fixx אינה שומרת צילומי מסך. מספרי חשבון ואשראי שמופיעים בטעות מצונזרים אוטומטית לפני כל עיבוד." },
      { q: "האם המידע שלי מאובטח?", a: "כן. כל המידע מוצפן בהתאם לחוק הגנת הפרטיות הישראלי תשמ״א-1981 ותיקון 13. Fixx לא מוכרת ולא מעבירה מידע אישי לצדדים שלישיים." },
    ],
  },
  {
    title: "מו״מ וחיסכון",
    items: [
      { q: "האם Fixx יכולה לבטל שירות בלי רשותי?", a: "בשום פנים ואופן. Fixx לא מבצעת שום שינוי — לא מעבר ספק, לא ביטול, לא שדרוג — בלי האישור המפורש שלך." },
      { q: "מה קורה אם הספק לא מגיב?", a: "אם הספק לא מגיב תוך 72 שעות, Fixx תציג לך המלצה אסטרטגית — לפעמים המהלך הנכון הוא לעבור לספק אחר לתקופה קצרה כדי לקבל הצעה טובה יותר מהספק המקורי." },
      { q: "כמה אפשר לחסוך?", a: "חיסכון ממוצע של אלפי שקלים בשנה על 6-8 חבילות. הסכום תלוי בספקים שלך ובתחרות בשוק." },
      { q: "האם Fixx לוקחת עמלה?", a: "Fixx מקבלת עמלת הפניה מספקים כשהיא מעבירה אליהם לקוחות. עמלה זו אינה גורעת מהחיסכון שלך ואינה גובה ממך דבר." },
    ],
  },
  {
    title: "טכני",
    items: [
      { q: "איך אני מוסיף חיוב חדש שלא הכנסתי בהתחלה?", a: "פתח את התפריט (☰) ולחץ על ״הוסף חיוב חדש״ תחת ׳אזור אישי׳. השאלון פתוח תמיד לעדכון." },
      { q: "איך אני מוחק את החשבון שלי?", a: "פתח את התפריט (☰) ← גלול לתחתית לסעיף ׳חשבון׳ ← לחץ על ׳מחיקת חשבון׳. כל המידע שלך נמחק לצמיתות תוך 30 יום." },
    ],
  },
];

function FaqPage() {
  const [query, setQuery] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return SECTIONS;
    return SECTIONS.map((s) => ({
      ...s,
      items: s.items.filter((it) => it.q.includes(q) || it.a.includes(q)),
    })).filter((s) => s.items.length > 0);
  }, [query]);

  return (
    <AppShell>
      <h1 className="text-xl font-bold mt-2">שאלות ותשובות</h1>
      <p className="text-sm text-muted-foreground mt-1">כל מה שרצית לדעת על Fixx</p>

      <div className="relative mt-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חיפוש שאלה..."
          className="w-full rounded-2xl bg-secondary border border-border pr-10 pl-4 py-3 text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="mt-6 space-y-6">
        {filtered.map((sec) => (
          <section key={sec.title}>
            <h2 className="text-[11px] uppercase tracking-wider mb-2 text-muted-foreground">{sec.title}</h2>
            <div className="space-y-2">
              {sec.items.map((it, idx) => {
                const key = `${sec.title}-${idx}`;
                const open = openKey === key;
                return (
                  <div
                    key={key}
                    role="button"
                    tabIndex={0}
                    onClick={() => setOpenKey(open ? null : key)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setOpenKey(open ? null : key);
                      }
                    }}
                    className="w-full text-right rounded-2xl border border-border p-4 cursor-pointer select-none bg-secondary"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-sm">{it.q}</span>
                      <ChevronDown
                        className="size-4 shrink-0 transition-transform duration-200"
                        style={{ color: "var(--primary)", transform: open ? "rotate(180deg)" : "none" }}
                      />
                    </div>
                    {open && (
                      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{it.a}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground text-sm mt-10">לא נמצאו תוצאות</p>
        )}
      </div>

      <div className="mt-8 rounded-2xl border border-border p-5 text-right bg-secondary">
        <h3 className="font-semibold text-sm">לא מצאת תשובה?</h3>
        <p className="text-xs text-muted-foreground mt-1">צוות התמיכה של Fixx ישמח לעזור</p>
        <a
          href="mailto:support@fixx.ai"
          className="mt-3 w-full flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold bg-primary text-primary-foreground"
        >
          <Mail className="size-4 shrink-0" />
          <span>פנה לתמיכה ← support@fixx.ai</span>
        </a>
      </div>
    </AppShell>
  );
}
