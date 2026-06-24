import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ensureAuthenticatedUser } from "@/lib/auth-session";
import { processExpiredConfirmations } from "@/lib/action-confirmation.service";
import { processExpiredActionConfirmations } from "@/lib/post-action-confirmation.functions";
import { runProactiveAgentCheck } from "@/lib/proactive-agent.functions";
import { runLocalProactiveCheck } from "@/lib/proactive-agent";
import { getLocalProviderStore } from "@/lib/local-providers";
import { getAuthUserOrLocal } from "@/lib/auth-session";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const user = await ensureAuthenticatedUser();
    if (!user) throw redirect({ to: "/auth" });
    return { user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const runProcessExpired = useServerFn(processExpiredActionConfirmations);
  const runAgentCheck = useServerFn(runProactiveAgentCheck);

  useEffect(() => {
    (async () => {
      const expired = await processExpiredConfirmations({ process: runProcessExpired });
      if (expired.length > 0) {
        toast.warning("פג תוקף אישור — הפעולה בוטלה אוטומטית (rollback)");
      }
    })();
  }, [runProcessExpired]);

  useEffect(() => {
    (async () => {
      try {
        const user = await getAuthUserOrLocal();
        if (user.source === "local") {
          const store = getLocalProviderStore();
          if (!store?.providers.length) return;
          const { newItems } = runLocalProactiveCheck(user.id, store.providers);
          for (const item of newItems) {
            if (item.activity_type === "expiry_alert") {
              toast.warning(item.summary, { duration: 8000 });
            } else if (item.activity_type === "promotion_alert") {
              toast.info(item.summary, { duration: 6000 });
            } else if (item.activity_type === "better_offer_found") {
              toast.success(item.summary, { duration: 6000 });
            }
          }
          return;
        }
        const result = await runAgentCheck();
        if (result.ran && result.newItems.length > 0) {
          for (const item of result.newItems) {
            if (item.activity_type === "expiry_alert") {
              toast.warning(item.summary, { duration: 8000 });
            } else if (item.activity_type === "promotion_alert") {
              toast.info(item.summary, { duration: 6000 });
            } else if (item.activity_type === "better_offer_found") {
              toast.success(item.summary, { duration: 6000 });
            }
          }
        }
      } catch {
        /* agent check is best-effort */
      }
    })();
  }, [runAgentCheck]);

  return (
    <div data-route-container className="min-h-screen w-full" style={{ transition: "none", animation: "none" }}>
      <Outlet />
    </div>
  );
}
