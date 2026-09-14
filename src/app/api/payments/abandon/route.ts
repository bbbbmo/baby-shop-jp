import { NextResponse } from "next/server";
import { DEFAULT_MARKET, isMarket, type Market } from "@/shared/config/markets";
import { siteOrigin } from "@/shared/lib/siteOrigin";
import { supabaseServer } from "@/shared/api/supabase/serverClient";

type PaymentRow = { id: string; order_id: string };

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const market = marketOf(url.searchParams.get("m"));
  const payment = await claimPendingPayment(url.searchParams.get("ref"));
  if (payment) {
    await supabaseServer.rpc("release_order_stock", { p_order_id: payment.order_id });
  }
  return NextResponse.redirect(`${siteOrigin(request)}/${market}/checkout`, 303);
}

function marketOf(value: string | null): Market {
  return isMarket(value) ? value : DEFAULT_MARKET;
}

async function claimPendingPayment(ref: string | null): Promise<PaymentRow | null> {
  if (!ref) return null;
  const { data } = await supabaseServer
    .from("payments")
    .update({ status: "failed", failure_code: "userCancelled" })
    .eq("id", ref)
    .eq("status", "pending")
    .select("id, order_id")
    .maybeSingle();
  return (data as PaymentRow | null) ?? null;
}
