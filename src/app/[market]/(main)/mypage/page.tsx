import { redirect } from "next/navigation";
import { createServerAuthClient } from "@/shared/api/supabase/serverAuthClient";
import { MypageView } from "@/views/mypage/MypageView";

export default async function MypagePage({
  params,
}: {
  params: Promise<{ market: string }>;
}) {
  const { market } = await params;
  const supabase = await createServerAuthClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data) {
    // 서버 redirect는 MarketLink를 거치지 않으므로 접두사를 직접 붙여야 한다.
    // "/signin"으로 보내면 [market]="signin"이 되어 notFound()로 떨어진다.
    redirect(`/${market}/signin`);
  }
  return <MypageView />;
}
