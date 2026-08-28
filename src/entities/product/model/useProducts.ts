"use client";

import { useQuery } from "@tanstack/react-query";
import { listProducts } from "@/shared/api/supabase/catalog";
import { useMarket } from "@/shared/market";

export function useProducts() {
  const market = useMarket();
  // 캐시 키에 마켓이 없으면 /jp에서 받아온 엔화 가격이 /kr에서 그대로 재사용된다.
  return useQuery({
    queryKey: ["products", market],
    queryFn: () => listProducts(market),
  });
}
