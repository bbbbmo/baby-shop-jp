"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/entities/auth";
import { isAdminEmail } from "@/shared/lib/adminAuth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/signin?redirect=/admin/products");
      return;
    }
    if (!isAdminEmail(user.email)) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading || !user || !isAdminEmail(user.email)) {
    return null;
  }
  return <div className="min-h-screen bg-background">{children}</div>;
}
