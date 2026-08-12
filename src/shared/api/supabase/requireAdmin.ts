import { supabaseServer } from "./serverClient";
import { isAdminEmail } from "@/shared/lib/adminAuth";

export type AdminAuthResult = { ok: true } | { ok: false; status: 401 | 403 };

export async function requireAdmin(request: Request): Promise<AdminAuthResult> {
  const token = extractBearerToken(request);
  if (!token) {
    return { ok: false, status: 401 };
  }
  const { data, error } = await supabaseServer.auth.getUser(token);
  if (error || !data.user) {
    return { ok: false, status: 401 };
  }
  return isAdminEmail(data.user.email) ? { ok: true } : { ok: false, status: 403 };
}

function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  return header?.startsWith("Bearer ") ? header.slice(7) : null;
}
