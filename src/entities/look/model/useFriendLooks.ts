"use client";

import { useQuery } from "@tanstack/react-query";
import { listFriendLooks } from "@/shared/api/supabase/catalog";

export function useFriendLooks() {
  return useQuery({ queryKey: ["friendLooks"], queryFn: listFriendLooks });
}
