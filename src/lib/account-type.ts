import type { AccountType } from "@/lib/business";
import type { BusinessProfile } from "@/lib/business";
import { getLocalUser } from "@/lib/local-auth";

const ACCOUNT_TYPE_KEY = "fixx_account_type";
const BUSINESS_PROFILE_KEY = "fixx_business_profile";

export function getLocalAccountType(): AccountType {
  if (typeof localStorage === "undefined") return "personal";
  return localStorage.getItem(ACCOUNT_TYPE_KEY) === "business" ? "business" : "personal";
}

export function setLocalAccountType(type: AccountType) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(ACCOUNT_TYPE_KEY, type);
}

export function getLocalBusinessProfile(): BusinessProfile | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(BUSINESS_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BusinessProfile;
  } catch {
    return null;
  }
}

export function saveLocalBusinessProfile(profile: BusinessProfile) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(BUSINESS_PROFILE_KEY, JSON.stringify(profile));
}

export async function getAccountType(userId: string, source: "local" | "supabase"): Promise<AccountType> {
  if (source === "local") return getLocalAccountType();

  const { supabase } = await import("@/integrations/supabase/client");
  const { data } = await supabase
    .from("user_profiles")
    .select("account_type")
    .eq("id", userId)
    .maybeSingle();
  return data?.account_type === "business" ? "business" : "personal";
}

export async function setAccountType(
  userId: string,
  type: AccountType,
  source: "local" | "supabase",
): Promise<void> {
  if (source === "local") {
    setLocalAccountType(type);
    return;
  }

  const { supabase } = await import("@/integrations/supabase/client");
  await supabase.from("user_profiles").update({ account_type: type }).eq("id", userId);
}

export async function fetchBusinessProfile(
  userId: string,
  source: "local" | "supabase",
): Promise<BusinessProfile | null> {
  if (source === "local") return getLocalBusinessProfile();

  const { supabase } = await import("@/integrations/supabase/client");
  const { data } = await supabase
    .from("business_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    user_id: data.user_id,
    business_name: data.business_name,
    business_type: data.business_type,
    employee_count: data.employee_count,
    fixed_expenses: (data.fixed_expenses || []) as BusinessProfile["fixed_expenses"],
    onboarding_complete: data.onboarding_complete,
    created_at: data.created_at,
  };
}

export async function saveBusinessProfile(
  profile: BusinessProfile,
  source: "local" | "supabase",
): Promise<void> {
  if (source === "local") {
    const localUser = getLocalUser();
    saveLocalBusinessProfile({
      ...profile,
      user_id: localUser?.id ?? profile.user_id,
      onboarding_complete: true,
    });
    setLocalAccountType("business");
    return;
  }

  const { supabase } = await import("@/integrations/supabase/client");
  await supabase.from("user_profiles").update({ account_type: "business" }).eq("id", profile.user_id);
  const { error } = await supabase.from("business_profiles").upsert(
    {
      user_id: profile.user_id,
      business_name: profile.business_name,
      business_type: profile.business_type,
      employee_count: profile.employee_count,
      fixed_expenses: profile.fixed_expenses,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

export async function resolvePostLoginPath(userId: string, source: "local" | "supabase"): Promise<string> {
  const accountType = await getAccountType(userId, source);
  if (accountType !== "business") return "/dashboard";
  const biz = await fetchBusinessProfile(userId, source);
  return biz?.onboarding_complete ? "/business-dashboard" : "/business-onboarding";
}
