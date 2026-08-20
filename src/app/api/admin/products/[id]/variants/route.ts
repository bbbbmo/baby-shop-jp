import { NextResponse } from "next/server";
import { requireAdmin } from "@/shared/api/supabase/requireAdmin";
import { supabaseServer } from "@/shared/api/supabase/serverClient";
import { failureStatus, toFailureCode } from "@/shared/api/supabase/adminServer";
import { mapVariantRow, type JoinedVariantRow } from "@/shared/api/supabase/catalog";
import { variantsRequestSchema, diffVariants, type VariantInput, type VariantDiff } from "@/features/admin-product-form";

type Params = { params: Promise<{ id: string }> };
type SavedVariant = { id: string; color: string; size: string; stock: number };
type IdLookup = { colorIdByHex: Map<string, string>; sizeIdByValue: Map<string, string> };

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
  const [existingResult, lookup] = await Promise.all([fetchExisting(productId), fetchLookup(incoming)]);
  if (existingResult.error) {
    return "unknownError";
  }
  if ("error" in lookup) {
    return lookup.error;
  }
  const diff = diffVariants(existingResult.data, incoming);
  return runVariantWrites(productId, diff, lookup);
}

async function fetchExisting(productId: string) {
  const { data, error } = await supabaseServer
    .from("product_variants")
    .select("id, stock, colors ( hex ), sizes ( value )")
    .eq("product_id", productId);
  const rows = (data ?? []) as unknown as JoinedVariantRow[];
  return { data: rows.map(mapVariantRow), error };
}

// 조회 자체가 실패한 것(DB 오류)과 값이 정말 테이블에 없는 것(입력 오류)을
// 구분해야 앞의 경우를 관리자 입력 탓(400)으로 잘못 돌리지 않는다.
type ResolveResult = { ids: Map<string, string> } | { dbError: true } | { notFound: true };

async function fetchLookup(incoming: VariantInput[]): Promise<IdLookup | { error: string }> {
  const colorResult = await resolveColorIds(incoming);
  if (!("ids" in colorResult)) {
    return { error: "dbError" in colorResult ? "unknownError" : "invalidColor" };
  }
  const sizeResult = await resolveSizeIds(incoming);
  if (!("ids" in sizeResult)) {
    return { error: "dbError" in sizeResult ? "unknownError" : "invalidSize" };
  }
  return { colorIdByHex: colorResult.ids, sizeIdByValue: sizeResult.ids };
}

async function resolveColorIds(incoming: VariantInput[]): Promise<ResolveResult> {
  const hexes = Array.from(new Set(incoming.map((v) => v.color)));
  const { data, error } = await supabaseServer.from("colors").select("id, hex").in("hex", hexes);
  if (error || !data) {
    return { dbError: true };
  }
  const byHex = new Map(data.map((c) => [c.hex, c.id]));
  return hexes.every((h) => byHex.has(h)) ? { ids: byHex } : { notFound: true };
}

async function resolveSizeIds(incoming: VariantInput[]): Promise<ResolveResult> {
  const values = Array.from(new Set(incoming.map((v) => v.size)));
  const { data, error } = await supabaseServer.from("sizes").select("id, value").in("value", values);
  if (error || !data) {
    return { dbError: true };
  }
  const byValue = new Map(data.map((s) => [s.value, s.id]));
  return values.every((v) => byValue.has(v)) ? { ids: byValue } : { notFound: true };
}

// ponytail: unique (product_id, color_id, size_id) 충돌을 피하려고 트랜잭션 없이
// delete → size_id를 NULL로 비우는 update → 실제 id로 채우는 update → insert
// 순으로 쓴다. 원자적이지 않아 도중에 실패하면 size_id가 NULL인 행이 DB에 남을
// 수 있고, 재저장이 항상 복구해 주지는 않는다(원인이 남아 있으면 같은 지점에서
// 다시 멈춘다). 흔한 원인이던 중복 (color, size)는 schema.ts에서 미리 막아 이
// 경로로 들어오지 못하게 했다 — 원자성이 필요해지면 deferrable unique 제약 +
// Postgres RPC로 옮긴다.
async function runVariantWrites(productId: string, diff: VariantDiff, lookup: IdLookup): Promise<string | null> {
  return (
    (await deleteVariants(productId, diff.toDeleteIds)) ??
    (await updateVariants(productId, diff.toUpdate, lookup, true)) ??
    (await updateVariants(productId, diff.toUpdate, lookup, false)) ??
    (await insertVariants(productId, diff.toInsert, lookup))
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
  lookup: IdLookup,
  placeholder: boolean,
): Promise<string | null> {
  for (const v of items) {
    const payload = placeholder
      ? { size_id: null }
      : { color_id: lookup.colorIdByHex.get(v.color), size_id: lookup.sizeIdByValue.get(v.size), stock: v.stock };
    const { error } = await supabaseServer
      .from("product_variants")
      .update(payload)
      .eq("id", v.id)
      .eq("product_id", productId);
    if (error) return toFailureCode(error);
  }
  return null;
}

async function insertVariants(productId: string, items: VariantDiff["toInsert"], lookup: IdLookup): Promise<string | null> {
  if (items.length === 0) {
    return null;
  }
  const rows = items.map((v) => ({
    product_id: productId,
    color_id: lookup.colorIdByHex.get(v.color),
    size_id: lookup.sizeIdByValue.get(v.size),
    stock: v.stock,
  }));
  const { error } = await supabaseServer.from("product_variants").insert(rows);
  return toFailureCode(error);
}

// 쓰기는 이미 성공했으므로 읽기 실패를 에러 응답으로 뒤집지 않는다. 대신 null로
// 알려서 클라이언트가 빈 배열을 "저장된 결과"로 오해하고 id를 지우지 않게 한다.
async function listVariants(productId: string): Promise<SavedVariant[] | null> {
  const { data, error } = await supabaseServer
    .from("product_variants")
    .select("id, stock, colors ( hex ), sizes ( value )")
    .eq("product_id", productId);
  if (error) {
    return null;
  }
  return ((data ?? []) as unknown as JoinedVariantRow[]).map(mapVariantRow);
}
