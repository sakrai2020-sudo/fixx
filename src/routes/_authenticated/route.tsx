import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ensureAuthenticatedUser } from "@/lib/auth-session";
import { processExpiredConfirmations } from "@/lib/action-confirmation.service";
import { processExpiredActionConfirmations } from "@/lib/post-action-confirmation.functions";

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

  useEffect(() => {
    (async () => {
      const expired = await processExpiredConfirmations({ process: runProcessExpired });
      if (expired.length > 0) {
        toast.warning("פג תוקף אישור — הפעולה בוטלה אוטומטית (rollback)");
      }
    })();
  }, [runProcessExpired]);

  return (
    <div data-route-container className="min-h-screen w-full" style={{ transition: "none", animation: "none" }}>
      <Outlet />
    </div>
  );
}
