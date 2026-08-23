"use client";

import { useEffect } from "react";
import Link from "next/link";
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
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border px-6 py-3">
        <Link href="/" className="text-sm text-foreground underline">
          ← 홈으로
        </Link>
      </div>
      {children}
    </div>
  );
}
