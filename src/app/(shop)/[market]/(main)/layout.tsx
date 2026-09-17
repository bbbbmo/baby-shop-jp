import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { createServerAuthClient } from "@/shared/api/supabase/serverAuthClient";
import { isAdminEmail } from "@/shared/lib/adminAuth";

export default async function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Header isAdmin={await isCurrentUserAdmin()} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}

// 관리자 이메일 목록은 서버에만 둔다. 헤더에는 판단 결과만 넘긴다.
// 실제 접근 차단은 /admin 레이아웃과 requireAdmin이 각자 담당한다.
async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createServerAuthClient();
  const { data, error } = await supabase.auth.getClaims();
  return !error && !!data && isAdminEmail(data.claims.email);
}
