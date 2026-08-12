import { NextResponse } from "next/server";
import { requireAdmin } from "@/shared/api/supabase/requireAdmin";
import { supabaseServer } from "@/shared/api/supabase/serverClient";
import { variantsRequestSchema, type VariantInput } from "@/features/admin-product-form/model/schema";
import { diffVariants, type VariantDiff } from "@/features/admin-product-form/model/variantDiff";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params): Promise<NextResponse> {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: auth.status });
  }
  const parsed = variantsRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalidInput" }, { status: 400 });
  }
  const { id: productId } = await params;
  const ok = await applyVariants(productId, parsed.data.variants);
  return ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "unknownError" }, { status: 500 });
}

async function applyVariants(productId: string, incoming: VariantInput[]): Promise<boolean> {
  const { data: existing, error } = await supabaseServer
    .from("product_variants")
    .select("id, color, size, stock")
    .eq("product_id", productId);
  if (error) {
    return false;
  }
  return runVariantWrites(productId, diffVariants(existing ?? [], incoming));
}

async function runVariantWrites(productId: string, diff: VariantDiff): Promise<boolean> {
  if (diff.toDeleteIds.length > 0) {
    const { error } = await supabaseServer.from("product_variants").delete().in("id", diff.toDeleteIds);
    if (error) return false;
  }
  if (diff.toInsert.length > 0) {
    const rows = diff.toInsert.map((v) => ({ product_id: productId, color: v.color, size: v.size, stock: v.stock }));
    const { error } = await supabaseServer.from("product_variants").insert(rows);
    if (error) return false;
  }
  return updateVariants(diff.toUpdate);
}

async function updateVariants(items: VariantDiff["toUpdate"]): Promise<boolean> {
  for (const v of items) {
    const { error } = await supabaseServer
      .from("product_variants")
      .update({ color: v.color, size: v.size, stock: v.stock })
      .eq("id", v.id);
    if (error) return false;
  }
  return true;
}
