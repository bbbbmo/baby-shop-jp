import Link from "next/link";
import { redirect } from "next/navigation";
import { DEFAULT_MARKET } from "@/shared/config/markets";
import { createServerAuthClient } from "@/shared/api/supabase/serverAuthClient";
import { isAdminEmail } from "@/shared/lib/adminAuth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerAuthClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data) {
    redirect(`/${DEFAULT_MARKET}/signin?redirect=/admin/products`);
  }
  if (!isAdminEmail(data.claims.email)) {
    redirect("/");
  }
  // 관리자 화면은 한국어 전용이라 LocaleProvider를 쓰지 않는다.
  // 문구는 각 화면이 직접 들고 있다.
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
