import { NextResponse } from "next/server";
import { requireAdmin } from "@/shared/api/supabase/requireAdmin";
import { supabaseServer } from "@/shared/api/supabase/serverClient";
import { productFieldsSchema, toProductRowPayload } from "@/features/admin-product-form";
import {
  failureStatus,
  productImageUrls,
  removeProductImageFiles,
  toFailureCode,
} from "@/shared/api/supabase/adminServer";

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
  // product_variants/product_images는 FK cascade로 같이 지워지지만 Storage
  // 파일은 남으므로, 지우기 전에 url을 모아 두었다가 함께 제거한다.
  const urls = await productImageUrls(id);
  const { error } = await supabaseServer.from("products").delete().eq("id", id);
  const failure = toFailureCode(error);
  if (failure) {
    return NextResponse.json({ error: failure }, { status: failureStatus(failure) });
  }
  await removeProductImageFiles(urls);
  return NextResponse.json({ ok: true });
}
