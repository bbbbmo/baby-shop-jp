import Link from "next/link";
import { redirect } from "next/navigation";
import { DEFAULT_MARKET } from "@/shared/config/markets";
import { createServerAuthClient } from "@/shared/api/supabase/serverAuthClient";
import { isAdminEmail } from "@/shared/lib/adminAuth";
import { LocaleProvider } from "@/shared/i18n/LocaleProvider";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerAuthClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data) {
    redirect(`/${DEFAULT_MARKET}/signin?redirect=/admin/products`);
  }
  if (!isAdminEmail(data.claims.email)) {
    redirect("/");
  }
  // /admin은 [market] 밖이라 LocaleProvider가 없다. 관리자 화면이 쓰는
  // QueryGuard가 useLocale()을 부르므로 여기서 감싸주지 않으면 렌더가 터진다.
  // 관리자 UI 문구는 한국어로 고정되어 있어 로케일도 한국어로 준다.
  return (
    <LocaleProvider initialLocale="ko">
      <div className="min-h-screen bg-background">
        <div className="border-b border-border px-6 py-3">
          <Link href="/" className="text-sm text-foreground underline">
            ← 홈으로
          </Link>
        </div>
        {children}
      </div>
    </LocaleProvider>
  );
}
