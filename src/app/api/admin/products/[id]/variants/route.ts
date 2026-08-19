import { NextResponse } from "next/server";
import { requireAdmin } from "@/shared/api/supabase/requireAdmin";
import { supabaseServer } from "@/shared/api/supabase/serverClient";
import { failureStatus, toFailureCode } from "@/shared/api/supabase/adminServer";
import { variantsRequestSchema, diffVariants, type VariantInput, type VariantDiff } from "@/features/admin-product-form";

type Params = { params: Promise<{ id: string }> };
type SavedVariant = { id: string; color: string; size: string; stock: number };

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
  const failure = await applyVariants(productId, parsed.data.variants);
  return failure
    ? NextResponse.json({ error: failure }, { status: failureStatus(failure) })
    : NextResponse.json({ variants: await listVariants(productId) });
}

async function applyVariants(productId: string, incoming: VariantInput[]): Promise<string | null> {
  const { data: existing, error } = await supabaseServer
    .from("product_variants")
    .select("id, color, size, stock")
    .eq("product_id", productId);
  if (error) {
    return "unknownError";
  }
  return runVariantWrites(productId, diffVariants(existing ?? [], incoming));
}

// ponytail: unique (product_id, color, size) 충돌을 피하려고 트랜잭션 없이
// delete → 임시값 update → 실제값 update → insert 순으로 쓴다. 원자적이지 않아
// 도중에 실패하면 `__tmp_` size가 DB에 남을 수 있고, 재저장이 항상 복구해 주지는
// 않는다(원인이 남아 있으면 같은 지점에서 다시 멈춘다). 흔한 원인이던 중복
// (color, size)는 schema.ts에서 미리 막아 이 경로로 들어오지 못하게 했다 —
// 원자성이 필요해지면 deferrable unique 제약 + Postgres RPC로 옮긴다.
async function runVariantWrites(productId: string, diff: VariantDiff): Promise<string | null> {
  return (
    (await deleteVariants(productId, diff.toDeleteIds)) ??
    (await updateVariants(productId, diff.toUpdate, true)) ??
    (await updateVariants(productId, diff.toUpdate, false)) ??
    (await insertVariants(productId, diff.toInsert))
  );
}

async function deleteVariants(productId: string, ids: string[]): Promise<string | null> {
  if (ids.length === 0) {
    return null;
  }
  const { error } = await supabaseServer
    .from("product_variants")
    .delete()
    .eq("product_id", productId)
    .in("id", ids);
  return toFailureCode(error);
}

async function updateVariants(
  productId: string,
  items: VariantDiff["toUpdate"],
  placeholder: boolean,
): Promise<string | null> {
  for (const v of items) {
    // 1단계는 행마다 고유한 임시 size로 기존 (color, size) 조합을 비워 둔다.
    const payload = placeholder
      ? { size: `__tmp_${v.id}` }
      : { color: v.color, size: v.size, stock: v.stock };
    const { error } = await supabaseServer
      .from("product_variants")
      .update(payload)
      .eq("id", v.id)
      .eq("product_id", productId);
    if (error) return toFailureCode(error);
  }
  return null;
}

async function insertVariants(productId: string, items: VariantDiff["toInsert"]): Promise<string | null> {
  if (items.length === 0) {
    return null;
  }
  const rows = items.map((v) => ({ product_id: productId, color: v.color, size: v.size, stock: v.stock }));
  const { error } = await supabaseServer.from("product_variants").insert(rows);
  return toFailureCode(error);
}

// 쓰기는 이미 성공했으므로 읽기 실패를 에러 응답으로 뒤집지 않는다. 대신 null로
// 알려서 클라이언트가 빈 배열을 "저장된 결과"로 오해하고 id를 지우지 않게 한다.
async function listVariants(productId: string): Promise<SavedVariant[] | null> {
  const { data, error } = await supabaseServer
    .from("product_variants")
    .select("id, color, size, stock")
    .eq("product_id", productId);
  return error ? null : (data ?? []);
}
