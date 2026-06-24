import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useRouter,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { MARKETING_META } from "@/lib/marketing-copy";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "sonner";
import { SplashScreen } from "@/components/SplashScreen";
import { GlobalLoadingOverlay, loadingOverlay } from "@/lib/loading-overlay";
import { RouteTransition } from "@/components/RouteTransition";
import { hasOAuthCallbackParams, isAuthCallbackPath, waitForAuthSession } from "@/lib/auth-session";

function NotFound() {
  return (
    <div className="app-screen flex items-center justify-center text-center px-6">
      <div>
        <h1 className="text-5xl font-bold">404</h1>
        <p className="mt-2 text-muted-foreground">הדף לא נמצא</p>
        <a href="/" className="mt-6 inline-block rounded-2xl bg-primary text-primary-foreground px-5 py-2.5 font-semibold">לעמוד הבית</a>
      </div>
    </div>
  );
}

function ErrorComp({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="app-screen flex items-center justify-center text-center px-6">
      <div>
        <h1 className="text-xl font-semibold">משהו השתבש</h1>
        <p className="mt-2 text-muted-foreground text-sm">אירעה שגיאה בלתי צפויה. נסה שוב.</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-6 rounded-2xl bg-primary text-primary-foreground px-5 py-2.5 font-semibold">נסה שוב</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" },
      { title: "Fixx — הסוכן הפיננסי האוטונומי שלך" },
      { name: "description", content: MARKETING_META },
      { name: "theme-color", content: "#0B1628" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: ErrorComp,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head><HeadContent /></head>
      <body style={{ background: "#0B1628", margin: 0 }}>{children}<Scripts /></body>
    </html>
  );
}

function hideOverlayAfterPaint(token?: number) {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => loadingOverlay.hide(token));
  });
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    let navigationToken: number | undefined;

    const unsubBefore = router.subscribe("onBeforeNavigate", () => {
      navigationToken = loadingOverlay.show();
    });

    const unsubResolved = router.subscribe("onResolved", () => {
      const token = navigationToken;
      navigationToken = undefined;
      hideOverlayAfterPaint(token);
    });

    return () => {
      unsubBefore();
      unsubResolved();
    };
  }, [router]);

  useEffect(() => {
    if (isAuthCallbackPath()) return;
    if (!hasOAuthCallbackParams()) return;

    const token = loadingOverlay.show("מתחבר");
    let cancelled = false;

    waitForAuthSession().then((session) => {
      if (cancelled) return;
      if (session) {
        router.invalidate().finally(() => hideOverlayAfterPaint(token));
        return;
      }
      hideOverlayAfterPaint(token);
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        router.invalidate();
        if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="mobile-app-frame" style={{ background: "#0B1628", transition: "none" }}>
        <SplashScreen />
        <RouteTransition>
          <Outlet />
        </RouteTransition>
        <GlobalLoadingOverlay />
        <Toaster position="top-center" theme="dark" richColors />
      </div>
    </QueryClientProvider>
  );
}
