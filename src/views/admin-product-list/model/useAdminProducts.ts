"use client";

import { useQuery } from "@tanstack/react-query";
import { listAdminProducts } from "@/shared/api/supabase/admin";

export function useAdminProducts() {
  return useQuery({ queryKey: ["admin-products"], queryFn: listAdminProducts });
}
