"use client";

import { useQuery } from "@tanstack/react-query";
import { listMyOrders } from "@/shared/api/supabase";

export function useMyOrders(userId: string | null) {
  return useQuery({
    queryKey: ["myOrders", userId],
    queryFn: listMyOrders,
    enabled: Boolean(userId),
  });
}
