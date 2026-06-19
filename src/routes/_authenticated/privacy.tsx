import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/privacy")({
  component: Privacy,
});

function Privacy() {
  return (
    <AppShell>
      <h1 className="text-xl font-bold mt-2">מדיניות פרטיות</h1>
      <p className="text-xs text-muted-foreground mt-1">עודכן לאחרונה: יוני 2026</p>

      <div className="mt-5 space-y-5 text-sm leading-relaxed">
        <Section title="המידע שאנחנו אוספים">
          Fixx אוספת רק את המידע ההכרחי לשירות: שם, אימייל/טלפון, שמות הספקים שלך
          והסכומים שאתה משלם. אנחנו לא מתחברים לחשבון הבנק שלך ולא רואים פרטי אשראי.
        </Section>
        <Section title="צילומי מסך">
          אם בחרת להעלות צילום מסך של הוראות קבע, הוא מעובד מיידית לזיהוי החיובים
          ונמחק לאחר העיבוד. מספרי חשבון ואשראי מצונזרים אוטומטית.
        </Section>
        <Section title="אבטחה">
          כל המידע מוצפן בהתאם לחוק הגנת הפרטיות הישראלי תשמ״א-1981 ולתיקון 13.
          הגישה למידע מוגבלת לעובדי Fixx בלבד, על בסיס צורך תפעולי.
        </Section>
        <Section title="שיתוף עם צדדים שלישיים">
          Fixx לא מוכרת ולא מעבירה את המידע האישי שלך לצדדים שלישיים. כשהסוכן
          פונה לספק בשמך — מועבר רק המידע ההכרחי לצורך אותו מו״מ.
        </Section>
        <Section title="הזכויות שלך">
          ניתן לבקש לראות, לתקן או למחוק את כל המידע שלנו עליך בכל עת.
          מחיקה מתבצעת לצמיתות תוך 30 יום מהבקשה.
        </Section>
        <Section title="יצירת קשר">
          לשאלות בנושא פרטיות: <a className="underline" style={{ color: "var(--primary)" }} href="mailto:privacy@fixx.ai">privacy@fixx.ai</a>
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
