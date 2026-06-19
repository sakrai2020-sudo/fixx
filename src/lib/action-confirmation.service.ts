import { getAuthUserOrLocal } from "@/lib/auth-session";
import {
  addLocalSavings,
  isLocalNegotiationId,
  updateLocalNegotiation,
  updateLocalProvider,
} from "@/lib/local-negotiations";
import {
  createLocalConfirmation,
  getLocalConfirmation,
  getLocalPendingConfirmations,
  patchLocalConfirmation,
  type ActionConfirmation,
  type ActionConfirmationType,
  type RollbackSnapshot,
} from "@/lib/post-action-confirmation";
import {
  cancelActionConfirmation,
  confirmActionConfirmation,
  createActionConfirmation,
  getActionConfirmation,
  listPendingActionConfirmations,
  processExpiredActionConfirmations,
} from "@/lib/post-action-confirmation.functions";

export type SubmitConfirmationParams = {
  negotiationId?: string;
  actionType: ActionConfirmationType;
  providerName: string;
  planName: string;
  monthlyPrice: number;
  rollback: RollbackSnapshot;
};

async function localRollback(snap: RollbackSnapshot): Promise<void> {
  updateLocalProvider(snap.user_provider_id, {
    provider_name: snap.provider_name,
    plan_name: snap.plan_name,
    monthly_price: snap.monthly_price,
  });
  if (snap.negotiation_id && isLocalNegotiationId(snap.negotiation_id)) {
    updateLocalNegotiation(snap.negotiation_id, { status: "active" });
  }
  if (snap.savings_quarter_share && snap.savings_quarter_share > 0) {
    addLocalSavings(-snap.savings_quarter_share);
  }
}

function processExpiredLocal(userId: string): string[] {
  const now = Date.now();
  const expired: string[] = [];
  for (const conf of getLocalPendingConfirmations(userId)) {
    if (now <= new Date(conf.expires_at).getTime()) continue;
    void localRollback(conf.rollback);
    patchLocalConfirmation(conf.id, userId, {
      status: "expired",
      resolved_at: new Date().toISOString(),
    });
    expired.push(conf.id);
  }
  return expired;
}

export async function submitActionConfirmation(
  params: SubmitConfirmationParams,
  serverFns: {
    create: (args: { data: SubmitConfirmationParams }) => Promise<ActionConfirmation>;
  },
): Promise<ActionConfirmation> {
  const user = await getAuthUserOrLocal();

  if (user.source === "local") {
    return createLocalConfirmation({
      userId: user.id,
      negotiationId: params.negotiationId,
      actionType: params.actionType,
      providerName: params.providerName,
      planName: params.planName,
      monthlyPrice: params.monthlyPrice,
      contactEmail: user.email || "—",
      contactPhone: "—",
      rollback: params.rollback,
    });
  }

  return serverFns.create({ data: params });
}

export async function confirmAction(
  id: string,
  serverFns: {
    confirm: (args: { data: { id: string } }) => Promise<ActionConfirmation>;
  },
): Promise<ActionConfirmation> {
  const user = await getAuthUserOrLocal();
  if (user.source === "local") {
    const updated = patchLocalConfirmation(id, user.id, {
      status: "confirmed",
      resolved_at: new Date().toISOString(),
    });
    if (!updated) throw new Error("Confirmation not found");
    return updated;
  }
  return serverFns.confirm({ data: { id } });
}

export async function cancelAction(
  id: string,
  serverFns: {
    cancel: (args: { data: { id: string } }) => Promise<ActionConfirmation>;
  },
): Promise<ActionConfirmation> {
  const user = await getAuthUserOrLocal();
  if (user.source === "local") {
    const conf = getLocalConfirmation(id, user.id);
    if (!conf || conf.status !== "pending") throw new Error("Confirmation not found");
    await localRollback(conf.rollback);
    const updated = patchLocalConfirmation(id, user.id, {
      status: "cancelled",
      resolved_at: new Date().toISOString(),
    });
    if (!updated) throw new Error("Cancel failed");
    return updated;
  }
  return serverFns.cancel({ data: { id } });
}

export async function fetchPendingConfirmations(
  serverFns: {
    list: () => Promise<ActionConfirmation[]>;
  },
): Promise<ActionConfirmation[]> {
  const user = await getAuthUserOrLocal();
  if (user.source === "local") {
    processExpiredLocal(user.id);
    return getLocalPendingConfirmations(user.id);
  }
  return serverFns.list();
}

export async function fetchConfirmationById(
  id: string,
  serverFns: {
    get: (args: { data: { id: string } }) => Promise<ActionConfirmation | null>;
  },
): Promise<ActionConfirmation | null> {
  const user = await getAuthUserOrLocal();
  if (user.source === "local") {
    return getLocalConfirmation(id, user.id);
  }
  return serverFns.get({ data: { id } });
}

export async function processExpiredConfirmations(
  serverFns: {
    process: () => Promise<{ expired: string[] }>;
  },
): Promise<string[]> {
  const user = await getAuthUserOrLocal();
  if (user.source === "local") {
    return processExpiredLocal(user.id);
  }
  const result = await serverFns.process();
  return result.expired;
}

export {
  createActionConfirmation,
  confirmActionConfirmation,
  cancelActionConfirmation,
  processExpiredActionConfirmations,
  listPendingActionConfirmations,
  getActionConfirmation,
};
