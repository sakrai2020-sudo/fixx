import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  biometricSupported,
  registerBiometric,
  hasBiometricHint,
  rememberBiometric,
} from "@/lib/biometric-client";
import { Fingerprint, X } from "lucide-react";

const DISMISS_KEY = "nego.bioPromptDismissed";

export function BiometricEnrollPrompt() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (!biometricSupported()) return;
      try {
        if (localStorage.getItem(DISMISS_KEY)) return;
      } catch {}
      if (hasBiometricHint()) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;
      const { data: prof } = await supabase
        .from("user_profiles")
        .select("biometric_enabled")
        .eq("id", user.id)
        .maybeSingle();
      if (prof?.biometric_enabled) {
        rememberBiometric(user.email);
        return;
      }
      setShow(true);
    })();
  }, []);

  if (!show) return null;

  const enable = async () => {
    setBusy(true);
    try {
      await registerBiometric();
      toast.success("הכניסה הביומטרית הופעלה");
      setShow(false);
    } catch (e: any) {
      toast.error(e?.message || "לא ניתן להפעיל כניסה ביומטרית");
    } finally {
      setBusy(false);
    }
  };

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch {}
    setShow(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-6 pointer-events-none">
      <div className="mx-auto max-w-[390px] glass-card p-5 pointer-events-auto relative w-[calc(100%-2rem)]">
        <button onClick={dismiss} className="absolute top-3 left-3 text-muted-foreground">
          <X className="size-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(0,194,168,0.15)", color: "var(--primary)" }}>
            <Fingerprint className="size-6" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">הפעל כניסה מהירה</p>
            <p className="text-xs text-muted-foreground mt-0.5">היכנס בפעם הבאה עם Face ID או טביעת אצבע</p>
          </div>
        </div>
        <button
          disabled={busy}
          onClick={enable}
          className="mt-4 w-full rounded-[16px] bg-primary text-primary-foreground font-bold py-3 disabled:opacity-50"
        >
          {busy ? "מפעיל…" : "הפעל עכשיו"}
        </button>
        <button onClick={dismiss} className="mt-2 w-full text-xs text-muted-foreground py-1">
          לא עכשיו
        </button>
      </div>
    </div>
  );
}
