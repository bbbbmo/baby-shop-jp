"use client";

import { useQuery } from "@tanstack/react-query";
import { getProductImages } from "@/shared/api/supabase/admin";

export function useProductImages(productId: string) {
  return useQuery({ queryKey: ["admin-product-images", productId], queryFn: () => getProductImages(productId) });
}
