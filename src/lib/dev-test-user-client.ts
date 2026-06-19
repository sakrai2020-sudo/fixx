import { supabase } from "@/integrations/supabase/client";
import { DEV_TEST_USER } from "@/lib/dev-test-user";

/** Client fallback when service role is unavailable — requires Email auth enabled in Supabase. */
export async function provisionDevTestUserClient(): Promise<void> {
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: DEV_TEST_USER.email,
    password: DEV_TEST_USER.password,
  });
  if (!signInErr) {
    await supabase.auth.signOut();
    return;
  }

  const { error: signUpErr } = await supabase.auth.signUp({
    email: DEV_TEST_USER.email,
    password: DEV_TEST_USER.password,
    options: { data: { name: "Test User" } },
  });
  if (signUpErr && !signUpErr.message.toLowerCase().includes("already")) {
    throw signUpErr;
  }
}
