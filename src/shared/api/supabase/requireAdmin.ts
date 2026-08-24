import { createServerAuthClient } from "./serverAuthClient";
import { isAdminEmail } from "@/shared/lib/adminAuth";

export type AdminAuthResult = { ok: true } | { ok: false; status: 401 | 403 };

export async function requireAdmin(): Promise<AdminAuthResult> {
  const supabase = await createServerAuthClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data) {
    return { ok: false, status: 401 };
  }
  return isAdminEmail(data.claims.email) ? { ok: true } : { ok: false, status: 403 };
}
