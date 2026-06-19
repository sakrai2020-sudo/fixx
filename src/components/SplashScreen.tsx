import { useEffect } from "react";
import { loadingOverlay } from "@/lib/loading-overlay";
import { waitForAuthSession } from "@/lib/auth-session";

const MIN_VISIBLE_MS = 400;
const MAX_VISIBLE_MS = 2000;

export function SplashScreen() {
  useEffect(() => {
    let cancelled = false;
    const token = loadingOverlay.show();

    const hide = () => {
      if (cancelled) return;
      window.setTimeout(() => {
        if (!cancelled) loadingOverlay.hide(token);
      }, MIN_VISIBLE_MS);
    };

    const maxTimer = window.setTimeout(hide, MAX_VISIBLE_MS);
    waitForAuthSession(MAX_VISIBLE_MS).finally(() => {
      window.clearTimeout(maxTimer);
      hide();
    });

    return () => {
      cancelled = true;
      window.clearTimeout(maxTimer);
      loadingOverlay.hide(token);
    };
  }, []);

  return null;
}
