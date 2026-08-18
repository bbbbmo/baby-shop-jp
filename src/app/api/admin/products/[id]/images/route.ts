import { NextResponse } from "next/server";
import { requireAdmin } from "@/shared/api/supabase/requireAdmin";
import { supabaseServer } from "@/shared/api/supabase/serverClient";
import {
  PRODUCT_IMAGES_BUCKET as BUCKET,
  removeProductImageFiles,
} from "@/shared/api/supabase/adminServer";

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
  const { data, error } = await supabaseServer
    .from("product_images")
    .delete()
    .eq("id", imageId)
    .select("url");
  if (error) {
    return NextResponse.json({ error: "unknownError" }, { status: 500 });
  }
  await removeProductImageFiles((data ?? []).map((row) => row.url));
  return NextResponse.json({ ok: true });
}
