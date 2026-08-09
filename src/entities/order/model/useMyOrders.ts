"use client";

import { useQuery } from "@tanstack/react-query";
import { listMyOrders } from "@/shared/api/supabase";

export function useMyOrders(enabled: boolean) {
  return useQuery({ queryKey: ["myOrders"], queryFn: listMyOrders, enabled });
}
