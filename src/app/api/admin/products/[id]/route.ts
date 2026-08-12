import { NextResponse } from "next/server";
import { requireAdmin } from "@/shared/api/supabase/requireAdmin";
import { supabaseServer } from "@/shared/api/supabase/serverClient";
import { productFieldsSchema, toProductRowPayload } from "@/features/admin-product-form/model/schema";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params): Promise<NextResponse> {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: auth.status });
  }
  const parsed = productFieldsSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalidInput" }, { status: 400 });
  }
  const { id } = await params;
  const { error } = await supabaseServer.from("products").update(toProductRowPayload(parsed.data)).eq("id", id);
  return error
    ? NextResponse.json({ error: "unknownError" }, { status: 500 })
    : NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: Params): Promise<NextResponse> {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: auth.status });
  }
  const { id } = await params;
  // ponytail: product_variants/product_images는 FK on delete cascade로
  // 같이 지워지지만, Storage에 올린 실제 이미지 파일은 안 지워지고 남는다.
  // 업로드 개수가 많아지면 여기서 storage.remove()도 같이 호출하도록 확장.
  const { error } = await supabaseServer.from("products").delete().eq("id", id);
  return error
    ? NextResponse.json({ error: "unknownError" }, { status: 500 })
    : NextResponse.json({ ok: true });
}
