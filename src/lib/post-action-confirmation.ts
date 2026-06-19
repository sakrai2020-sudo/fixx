export type ActionConfirmationType = "registration" | "switch" | "disconnect";
export type ActionConfirmationStatus = "pending" | "confirmed" | "cancelled" | "expired";

export type RollbackSnapshot = {
  user_provider_id: string;
  provider_name: string;
  plan_name: string;
  monthly_price: number;
  negotiation_id?: string;
  savings_quarter_share?: number;
};

export type ActionConfirmation = {
  id: string;
  user_id: string;
  negotiation_id?: string | null;
  action_type: ActionConfirmationType;
  provider_name: string;
  plan_name: string;
  monthly_price: number;
  contact_email: string | null;
  contact_phone: string | null;
  rollback: RollbackSnapshot;
  status: ActionConfirmationStatus;
  expires_at: string;
  created_at: string;
  protocol_sent_at?: string | null;
  resolved_at?: string | null;
};

const ACTION_LABELS: Record<ActionConfirmationType, string> = {
  registration: "רישום",
  switch: "מעבר",
  disconnect: "ניתוק",
};

const LOCAL_KEY = "nego_action_confirmations";

export function getProtocolTitle(): string {
  return "פרוטוקול אישור — ביצעתי עבורך:";
}

export function computeExpiresAt(from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + 3);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

export function formatExpiryDisplay(expiresAt: string): string {
  const d = new Date(expiresAt);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm} בשעה 23:59`;
}

export function getActionLabel(type: ActionConfirmationType): string {
  return ACTION_LABELS[type];
}

export function buildProtocolLines(conf: Pick<
  ActionConfirmation,
  "action_type" | "provider_name" | "plan_name" | "monthly_price" | "contact_email" | "contact_phone" | "expires_at"
>): string[] {
  const price = `₪${Math.round(Number(conf.monthly_price)).toLocaleString("he-IL")}/חודש`;
  const email = conf.contact_email || "—";
  const phone = conf.contact_phone || "—";
  return [
    getActionLabel(conf.action_type),
    `${conf.provider_name} · ${conf.plan_name} · ${price}`,
    `נתונים: ${email}, ${phone}`,
    `תוקף אישור: 3 ימים — עד ${formatExpiryDisplay(conf.expires_at)}`,
  ];
}

export function buildProtocolBody(conf: Parameters<typeof buildProtocolLines>[0]): string {
  return [getProtocolTitle(), ...buildProtocolLines(conf)].join("\n");
}

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `pac-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadLocal(): ActionConfirmation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as ActionConfirmation[]) : [];
  } catch {
    return [];
  }
}

function saveLocal(list: ActionConfirmation[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
}

export function getLocalConfirmation(id: string, userId: string): ActionConfirmation | null {
  return loadLocal().find((c) => c.id === id && c.user_id === userId) || null;
}

export function getLocalPendingConfirmations(userId: string): ActionConfirmation[] {
  return loadLocal().filter((c) => c.user_id === userId && c.status === "pending");
}

export function createLocalConfirmation(params: {
  userId: string;
  negotiationId?: string;
  actionType: ActionConfirmationType;
  providerName: string;
  planName: string;
  monthlyPrice: number;
  contactEmail: string;
  contactPhone: string;
  rollback: RollbackSnapshot;
}): ActionConfirmation {
  const now = new Date();
  const conf: ActionConfirmation = {
    id: newId(),
    user_id: params.userId,
    negotiation_id: params.negotiationId ?? null,
    action_type: params.actionType,
    provider_name: params.providerName,
    plan_name: params.planName,
    monthly_price: params.monthlyPrice,
    contact_email: params.contactEmail,
    contact_phone: params.contactPhone,
    rollback: params.rollback,
    status: "pending",
    created_at: now.toISOString(),
    expires_at: computeExpiresAt(now),
    protocol_sent_at: now.toISOString(),
  };
  const list = loadLocal();
  list.unshift(conf);
  saveLocal(list);
  console.info("[Fixx protocol] SMS + email", buildProtocolBody(conf));
  return conf;
}

export function patchLocalConfirmation(
  id: string,
  userId: string,
  patch: Partial<ActionConfirmation>,
): ActionConfirmation | null {
  const list = loadLocal();
  const idx = list.findIndex((c) => c.id === id && c.user_id === userId);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch };
  saveLocal(list);
  return list[idx];
}
