import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { PostActionConfirmationCard } from "@/components/PostActionConfirmationCard";
import { fetchConfirmationById } from "@/lib/action-confirmation.service";
import { getActionConfirmation } from "@/lib/post-action-confirmation.functions";
import type { ActionConfirmation } from "@/lib/post-action-confirmation";

export const Route = createFileRoute("/_authenticated/confirm/$id")({
  component: ConfirmActionPage,
});

function ConfirmActionPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const runGet = useServerFn(getActionConfirmation);
  const [conf, setConf] = useState<ActionConfirmation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const row = await fetchConfirmationById(id, { get: runGet });
      setConf(row);
      setLoading(false);
    })();
  }, [id, runGet]);

  if (loading) {
    return (
      <AppShell showBottomNav={false}>
        <p className="mt-10 text-center text-muted-foreground text-sm">טוען…</p>
      </AppShell>
    );
  }

  if (!conf) {
    return (
      <AppShell showBottomNav={false}>
        <div className="empty-state mt-16">
          <p className="font-semibold">פרוטוקול לא נמצא</p>
          <button type="button" onClick={() => navigate({ to: "/dashboard" })} className="mt-4 btn-primary px-6 py-3">
            חזור לדאשבורד
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell showBottomNav={false}>
      <h1 className="text-xl font-bold mt-2">אישור פעולה</h1>
      <p className="text-sm text-muted-foreground mt-1">
        נשלח אליך SMS ודוא״ל עם פרטי הפעולה. אשר או בטל תוך 3 ימים.
      </p>
      <PostActionConfirmationCard
        confirmation={conf}
        onResolved={(updated) => {
          setConf(updated);
          if (updated.status !== "pending") {
            setTimeout(() => navigate({ to: "/dashboard" }), 1200);
          }
        }}
      />
    </AppShell>
  );
}
