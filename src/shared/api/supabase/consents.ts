import { supabase } from "./client";

export type ConsentType = "terms" | "privacy" | "marketing";

export type ConsentInput = {
  terms: boolean;
  privacy: boolean;
  marketing: boolean;
};

// RLS의 "own consents read" 정책이 본인 행만 돌려주므로 user_id 조건이 필요 없다.
export async function hasConsentRecord(): Promise<boolean> {
  const { data, error } = await supabase.from("user_consents").select("id").limit(1);
  if (error) {
    throw new Error(error.message);
  }
  return (data?.length ?? 0) > 0;
}

export async function saveConsents(
  userId: string,
  input: ConsentInput,
): Promise<{ error: string | null }> {
  const types: ConsentType[] = ["terms", "privacy", "marketing"];
  const rows = types.map((type) => ({
    user_id: userId,
    consent_type: type,
    agreed: input[type],
  }));
  const { error } = await supabase.from("user_consents").insert(rows);
  return { error: error ? error.message : null };
}
