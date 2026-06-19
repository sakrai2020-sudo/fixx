import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Fingerprint, Save } from "lucide-react";
import { toast } from "sonner";
import {
  biometricSupported,
  clearBiometricHint,
  hasBiometricHint,
  registerBiometric,
} from "@/lib/biometric-client";

export const Route = createFileRoute("/_authenticated/profile")({
  component: Profile,
});

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [bioOn, setBioOn] = useState(false);
  const [bioBusy, setBioBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setEmail(user?.email || "");
      setPhone(user?.phone || "");
      if (user) {
        const { data } = await supabase.from("user_profiles").select("*").eq("id", user.id).maybeSingle();
        setProfile(data);
        setName(data?.name || "");
        setCity(data?.city || "");
        if (data?.phone) setPhone(data.phone);
      }
      setBioOn(biometricSupported() && hasBiometricHint());
    })();
  }, []);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error: pErr } = await supabase
        .from("user_profiles")
        .upsert({ id: user.id, name: name.trim() || null, city: city.trim() || null, phone: phone.trim() || null });
      if (pErr) throw pErr;
      if (email && email !== user.email) {
        const { error: eErr } = await supabase.auth.updateUser({ email });
        if (eErr) throw eErr;
        toast.success("נשלח אימייל לאימות הכתובת החדשה");
      } else {
        toast.success("הפרטים נשמרו");
      }
    } catch (e: any) {
      toast.error(e?.message || "שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
  };

  const toggleBio = async () => {
    if (!biometricSupported()) {
      toast.error("המכשיר לא תומך בכניסה ביומטרית");
      return;
    }
    setBioBusy(true);
    try {
      if (bioOn) {
        clearBiometricHint();
        if (user) await supabase.from("user_profiles").update({ biometric_enabled: false }).eq("id", user.id);
        setBioOn(false);
        toast.success("הכניסה הביומטרית בוטלה");
      } else {
        await registerBiometric();
        if (user) await supabase.from("user_profiles").update({ biometric_enabled: true }).eq("id", user.id);
        setBioOn(true);
        toast.success("כניסה ביומטרית הופעלה");
      }
    } catch (e: any) {
      toast.error(e?.message || "כשל בהפעלת כניסה ביומטרית");
    } finally {
      setBioBusy(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const initial = (profile?.name || user?.email || "?")[0]?.toUpperCase();

  return (
    <AppShell>
      <h1 className="text-xl font-bold mt-2">פרופיל אישי</h1>

      <div className="mt-5 glass-card p-5 text-center">
        <div
          className="size-16 rounded-full mx-auto flex items-center justify-center text-2xl font-bold"
          style={{ background: "rgba(0,194,168,0.15)", color: "var(--primary)" }}
        >
          {initial}
        </div>
        <p className="mt-3 font-semibold">{name || "—"}</p>
        <p className="text-xs text-muted-foreground">{email || phone}</p>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        <Field label="שם מלא">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="לדוגמא: ישראל ישראלי"
            className="h-10 w-full rounded-xl bg-secondary border border-border px-3 text-sm text-right focus:outline-none focus:border-primary"
          />
        </Field>
        <Field label="עיר (ללוח התחסכונות)">
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="לדוגמא: תל אביב"
            className="h-10 w-full rounded-xl bg-secondary border border-border px-3 text-sm text-right focus:outline-none focus:border-primary"
          />
        </Field>
        <Field label="טלפון">
          <input
            dir="ltr"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+972501234567"
            className="h-10 w-full rounded-xl bg-secondary border border-border px-3 text-sm text-left focus:outline-none focus:border-primary"
          />
        </Field>
        <Field label="אימייל">
          <input
            dir="ltr"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@email.com"
            className="h-10 w-full rounded-xl bg-secondary border border-border px-3 text-sm text-left focus:outline-none focus:border-primary"
          />
        </Field>

        <button
          disabled={saving}
          onClick={save}
          className="mt-1 w-full rounded-2xl bg-primary text-primary-foreground font-bold py-3.5 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save className="size-4" />
          {saving ? "שומר..." : "שמור שינויים"}
        </button>
      </div>

      {biometricSupported() && (
        <div className="mt-6 glass-card p-4 flex items-center gap-3">
          <div
            className="size-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(0,194,168,0.15)", color: "var(--primary)" }}
          >
            <Fingerprint className="size-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">כניסה ביומטרית</p>
            <p className="text-[12px] text-muted-foreground">היכנס מהר עם Face ID או טביעת אצבע</p>
          </div>
          <button
            onClick={toggleBio}
            disabled={bioBusy}
            role="switch"
            aria-checked={bioOn}
            className="relative w-12 h-7 rounded-full transition-colors disabled:opacity-50"
            style={{ background: bioOn ? "var(--primary)" : "var(--muted)" }}
          >
            <span
              className="absolute top-0.5 size-6 rounded-full bg-white transition-all"
              style={{ right: bioOn ? "2px" : "22px" }}
            />
          </button>
        </div>
      )}

      <button
        onClick={signOut}
        className="mt-6 w-full glass-card py-3.5 flex items-center justify-center gap-2 font-semibold"
        style={{ color: "var(--danger)" }}
      >
        <LogOut className="size-4" /> התנתקות
      </button>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}
