import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/disclosure")({
  component: Disclosure,
});

function Disclosure() {
  return (
    <AppShell>
      <h1 className="text-xl font-bold mt-2">גילוי נאות</h1>
      <p className="text-xs text-muted-foreground mt-1">Fixx פועלת בשקיפות מלאה. כך זה עובד.</p>

      <div className="mt-5 space-y-5 text-sm leading-relaxed">
        <Section title="מודל הכנסה">
          הספקים משלמים לנו עמלת שיווק כשאנחנו מעבירים אליהם לקוח חדש. זה בדיוק
          מה שמאפשר ל-Fixx להישאר חינמית עבורך לחלוטין. אתה חוסך — הספק משלם.
        </Section>
        <Section title="עצמאות ההמלצה">
          הסוכן ממליץ תמיד על ההצעה הטובה ביותר עבורך — לא על זו שמשלמת לנו
          יותר. כל המלצה מבוססת על נתוני שוק אמיתיים ועל החיסכון הנטו שלך בלבד.
        </Section>
        <Section title="ספקים שותפים">
          לא כל הספקים בישראל שותפים של Fixx. כשספק אינו שותף — נציג אותו
          בשקיפות מלאה ונמליץ עליו אם הוא הטוב ביותר עבורך.
        </Section>
        <Section title="חיסכון משוער">
          הערכות החיסכון מבוססות על נתוני שוק עדכניים. החיסכון בפועל תלוי
          בספק, בחבילה, ובאישור שלך.
        </Section>
        <Section title="לא ייעוץ פיננסי">
          Fixx אינה מספקת ייעוץ פיננסי, ביטוחי או משפטי מורשה. ההמלצות הן
          תפעוליות (השוואת מחירים ומו״מ) ולא ייעוץ אישי.
        </Section>
        <Section title="יצירת קשר">
          שאלות נוספות: <a className="underline" style={{ color: "var(--primary)" }} href="mailto:support@fixx.ai">support@fixx.ai</a>
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
