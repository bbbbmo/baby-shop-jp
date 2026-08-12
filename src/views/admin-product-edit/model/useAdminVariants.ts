"use client";

import { useQuery } from "@tanstack/react-query";
import { getProductVariants } from "@/shared/api/supabase/catalog";

export function useAdminVariants(productId: string) {
  return useQuery({ queryKey: ["admin-product-variants", productId], queryFn: () => getProductVariants(productId) });
}
