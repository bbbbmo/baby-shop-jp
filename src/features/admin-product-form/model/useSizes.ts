"use client";

import { useQuery } from "@tanstack/react-query";
import { listSizes } from "@/shared/api/supabase/admin";

export function useSizes() {
  return useQuery({ queryKey: ["admin-sizes"], queryFn: listSizes });
}
