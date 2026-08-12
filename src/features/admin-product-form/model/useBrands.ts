"use client";

import { useQuery } from "@tanstack/react-query";
import { listBrands } from "@/shared/api/supabase/admin";

export function useBrands() {
  return useQuery({ queryKey: ["admin-brands"], queryFn: listBrands });
}
