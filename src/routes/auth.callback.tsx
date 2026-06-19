import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { loadingOverlay } from "@/lib/loading-overlay";
import { completeOAuthCallback, clearOAuthCallbackUrl } from "@/lib/auth-session";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const router = useRouter();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const token = loadingOverlay.show("מתחבר");
    let cancelled = false;

    (async () => {
      try {
        const session = await completeOAuthCallback();
        if (cancelled) return;

        clearOAuthCallbackUrl();

        if (session) {
          await router.invalidate();
          navigate({ to: "/dashboard", replace: true });
        } else {
          toast.error("הכניסה נכשלה — נסה שוב");
          navigate({ to: "/auth", replace: true });
        }
      } catch (e: any) {
        if (cancelled) return;
        toast.error(e?.message || "הכניסה נכשלה — נסה שוב");
        navigate({ to: "/auth", replace: true });
      } finally {
        if (!cancelled) {
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => loadingOverlay.hide(token));
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, router]);

  return (
    <div
      className="app-screen flex flex-col items-center justify-center text-center px-6"
      style={{ background: "#0B1628", transition: "none" }}
    >
      <p className="text-sm text-muted-foreground">מתחבר עם Google...</p>
    </div>
  );
}
