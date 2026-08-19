import { NextResponse } from "next/server";
import { requireAdmin } from "@/shared/api/supabase/requireAdmin";
import { supabaseServer } from "@/shared/api/supabase/serverClient";
import { productFieldsSchema, toProductRowPayload } from "@/features/admin-product-form";

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: auth.status });
  }
  const parsed = productFieldsSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalidInput" }, { status: 400 });
  }
  const { data, error } = await supabaseServer
    .from("products")
    .insert(toProductRowPayload(parsed.data))
    .select("id")
    .single();
  return error || !data
    ? NextResponse.json({ error: "unknownError" }, { status: 500 })
    : NextResponse.json({ id: data.id });
}
