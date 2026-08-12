"use client";

import { getAccessToken } from "@/shared/api/supabase";

export async function adminFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers });
}
