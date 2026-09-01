"use client";

import { useQuery } from "@tanstack/react-query";
import { getIdentityProviders } from "@/shared/api/supabase";

// 이 계정이 어떤 방법으로 가입했는지. 비밀번호가 있는 계정인지 판단하는 데 쓴다.
export function useIdentityProviders() {
  return useQuery({ queryKey: ["identityProviders"], queryFn: getIdentityProviders });
}
