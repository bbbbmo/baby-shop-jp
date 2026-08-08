"use client";

import { useQuery } from "@tanstack/react-query";
import { getProduct } from "@/shared/api/supabase/catalog";

export function useProduct(id: string) {
  return useQuery({ queryKey: ["product", id], queryFn: () => getProduct(id) });
}
