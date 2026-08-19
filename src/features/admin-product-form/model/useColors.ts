"use client";

import { useQuery } from "@tanstack/react-query";
import { listColors } from "@/shared/api/supabase/admin";

export function useColors() {
  return useQuery({ queryKey: ["admin-colors"], queryFn: listColors });
}
