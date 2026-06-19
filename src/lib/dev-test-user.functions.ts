import { createServerFn } from "@tanstack/react-start";
import { DEV_TEST_USER } from "@/lib/dev-test-user";

export const ensureDevTestUser = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw new Error(listErr.message);

  const existing = list?.users?.find(
    (u) => u.email?.toLowerCase() === DEV_TEST_USER.email.toLowerCase(),
  );

  if (existing) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
      password: DEV_TEST_USER.password,
      email_confirm: true,
      user_metadata: { name: "Test User" },
    });
    if (error) throw new Error(error.message);
    return { ok: true as const, created: false };
  }

  const { error } = await supabaseAdmin.auth.admin.createUser({
    email: DEV_TEST_USER.email,
    password: DEV_TEST_USER.password,
    email_confirm: true,
    user_metadata: { name: "Test User" },
  });
  if (error) throw new Error(error.message);
  return { ok: true as const, created: true };
});
