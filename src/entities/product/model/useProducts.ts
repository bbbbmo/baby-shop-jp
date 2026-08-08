"use client";

import { useQuery } from "@tanstack/react-query";
import { listProducts } from "@/shared/api/supabase/catalog";

export function useProducts() {
  return useQuery({ queryKey: ["products"], queryFn: listProducts });
}
