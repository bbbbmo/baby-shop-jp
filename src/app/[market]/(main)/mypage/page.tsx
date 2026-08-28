import { redirect } from "next/navigation";
import { createServerAuthClient } from "@/shared/api/supabase/serverAuthClient";
import { MypageView } from "@/views/mypage/MypageView";

export default async function MypagePage() {
  const supabase = await createServerAuthClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data) {
    redirect("/signin");
  }
  return <MypageView />;
}
