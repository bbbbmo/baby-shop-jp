"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminProduct } from "@/shared/api/supabase/admin";

export function useAdminProduct(id: string) {
  return useQuery({ queryKey: ["admin-product", id], queryFn: () => getAdminProduct(id) });
}
