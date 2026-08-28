"use client";

import { useQuery } from "@tanstack/react-query";
import { getProduct } from "@/shared/api/supabase/catalog";
import { useMarket } from "@/shared/market";

export function useProduct(id: string) {
  const market = useMarket();
  return useQuery({ queryKey: ["product", id, market], queryFn: () => getProduct(id, market) });
}
