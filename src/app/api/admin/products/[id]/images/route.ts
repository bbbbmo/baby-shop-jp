import { NextResponse } from "next/server";
import { requireAdmin } from "@/shared/api/supabase/requireAdmin";
import { supabaseServer } from "@/shared/api/supabase/serverClient";

const BUCKET = "product-images";
type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params): Promise<NextResponse> {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: auth.status });
  }
  const { id: productId } = await params;
  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "invalidInput" }, { status: 400 });
  }
  const result = await uploadAndInsert(productId, file);
  return result
    ? NextResponse.json(result)
    : NextResponse.json({ error: "unknownError" }, { status: 500 });
}

async function uploadAndInsert(productId: string, file: File) {
  const path = `${productId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabaseServer.storage.from(BUCKET).upload(path, file);
  if (uploadError) {
    return null;
  }
  return insertImageRow(productId, path);
}

async function insertImageRow(productId: string, path: string) {
  const url = supabaseServer.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const sortOrder = await nextSortOrder(productId);
  const { data, error } = await supabaseServer
    .from("product_images")
    .insert({ product_id: productId, url, sort_order: sortOrder })
    .select("id, url, sort_order")
    .single();
  return error || !data ? null : { id: data.id, url: data.url, sortOrder: data.sort_order };
}

async function nextSortOrder(productId: string): Promise<number> {
  const { data } = await supabaseServer
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.sort_order ?? -1) + 1;
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: auth.status });
  }
  const imageId = new URL(request.url).searchParams.get("imageId");
  if (!imageId) {
    return NextResponse.json({ error: "invalidInput" }, { status: 400 });
  }
  // ponytail: Storage의 실제 파일은 지우지 않고 DB row만 지운다 (path를
  // 별도 컬럼에 저장하지 않아 url에서 역산해야 함 — 필요해지면 product_images에
  // path 컬럼을 추가해 storage.remove()까지 같이 호출하도록 확장).
  const { error } = await supabaseServer.from("product_images").delete().eq("id", imageId);
  return error
    ? NextResponse.json({ error: "unknownError" }, { status: 500 })
    : NextResponse.json({ ok: true });
}
