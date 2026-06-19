import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/terms")({
  component: Terms,
});

function Terms() {
  return (
    <AppShell>
      <h1 className="text-xl font-bold mt-2">תנאי שימוש</h1>
      <p className="text-xs text-muted-foreground mt-1">עודכן לאחרונה: יוני 2026</p>

      <div className="mt-5 space-y-5 text-sm leading-relaxed">
        <Section title="השירות">
          Fixx היא פלטפורמה שמנהלת בשמך מו״מ מול ספקי שירות. השימוש בשירות
          כפוף לתנאים המפורטים להלן. בהמשך השימוש אתה מאשר שקראת והסכמת.
        </Section>
        <Section title="אישור פעולות">
          Fixx לא מבצעת שום שינוי בחבילות שלך — מעבר ספק, ביטול, שדרוג —
          ללא אישור מפורש שלך לכל פעולה.
        </Section>
        <Section title="חיובים ועמלות">
          השירות חינמי למשתמש בתקופת ההשקה. Fixx מקבלת עמלת הפניה מספקים
          כשהיא מעבירה אליהם לקוחות. עמלה זו אינה גורעת מהחיסכון שלך.
        </Section>
        <Section title="דיוק המידע">
          חיסכון משוער מבוסס על נתוני השוק בזמן הצגתו. אנחנו עושים מאמץ
          להציג מידע מדויק אך לא מתחייבים לתוצאה ספציפית מול ספק כלשהו.
        </Section>
        <Section title="הפסקת שירות">
          ניתן למחוק את החשבון בכל עת מהתפריט. המחיקה מתבצעת לצמיתות תוך 30 יום.
        </Section>
        <Section title="דין שיפוט">
          על תנאים אלה חל הדין הישראלי. סמכות השיפוט נתונה לבתי המשפט בתל אביב-יפו.
        </Section>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-semibold text-foreground mb-1.5">{title}</h2>
      <p className="text-muted-foreground">{children}</p>
    </section>
  );
}
