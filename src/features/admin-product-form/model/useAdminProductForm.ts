"use client";

import { useForm, useFieldArray, type Resolver, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { productFormSchema, type ProductFormValues, type VariantInput } from "./schema";
import { adminFetch } from "@/shared/api/adminFetch";

const JSON_HEADERS = { "Content-Type": "application/json" };
const SAVE_FAILED = "저장에 실패했습니다";
const ORDER_HISTORY_EXISTS = "주문 이력이 있는 옵션은 삭제할 수 없습니다. 재고를 0으로 설정해 주세요.";

// ponytail: zod4의 z.coerce.number()는 입력 타입이 output과 달라(unknown)
// zodResolver의 제네릭 추론이 ProductFormValues와 어긋난다. 여기서만
// Resolver<ProductFormValues>로 단언해 우회한다 — schema.ts(Task 6)는
// 건드리지 않는다.
const resolver = zodResolver(productFormSchema) as Resolver<ProductFormValues>;

type SavedVariant = { id: string; color: string; size: string; stock: number };
type SaveResult = { id: string; variants: VariantInput[] };

export function useAdminProductForm(productId: string | null, defaultValues: ProductFormValues) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<ProductFormValues>({ resolver, defaultValues });
  const variantFields = useFieldArray({ control: form.control, name: "variants" });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      const result = await saveAll(productId, values);
      if (typeof result === "string") {
        setSubmitError(result);
        return;
      }
      applySaved(form, queryClient, values, result);
      if (!productId) router.push(`/admin/products/${result.id}/edit`);
    } catch {
      setSubmitError(SAVE_FAILED);
    }
  });

  return { form, variantFields, onSubmit, submitError };
}

/** 저장 성공 후 폼을 서버가 발급한 variant id로 다시 심고, 관련 캐시를 무효화한다. */
function applySaved(
  form: UseFormReturn<ProductFormValues>,
  queryClient: QueryClient,
  values: ProductFormValues,
  result: SaveResult,
) {
  form.reset({ ...values, variants: result.variants });
  queryClient.invalidateQueries({ queryKey: ["admin-products"] });
  queryClient.invalidateQueries({ queryKey: ["admin-product", result.id] });
  queryClient.invalidateQueries({ queryKey: ["admin-product-variants", result.id] });
}

async function saveAll(
  productId: string | null,
  values: ProductFormValues,
): Promise<SaveResult | string> {
  const id = await saveProductFields(productId, values);
  if (!id) {
    return SAVE_FAILED;
  }
  const saved = await saveVariants(id, values.variants);
  return typeof saved === "string" ? saved : { id, variants: withServerIds(values.variants, saved) };
}

/** (color, size)는 상품 안에서 유일하므로 이걸로 서버가 준 id를 되붙인다. */
function withServerIds(values: VariantInput[], saved: SavedVariant[]): VariantInput[] {
  return values.map((v) => ({
    ...v,
    id: saved.find((s) => s.color === v.color && s.size === v.size)?.id,
  }));
}

async function saveProductFields(
  productId: string | null,
  values: ProductFormValues,
): Promise<string | null> {
  const url = productId ? `/api/admin/products/${productId}` : "/api/admin/products";
  const method = productId ? "PATCH" : "POST";
  const res = await adminFetch(url, { method, headers: JSON_HEADERS, body: JSON.stringify(values) });
  if (!res.ok) return null;
  return productId ?? ((await res.json()) as { id: string }).id;
}

async function saveVariants(
  productId: string,
  variants: VariantInput[],
): Promise<SavedVariant[] | string> {
  const res = await adminFetch(`/api/admin/products/${productId}/variants`, {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify({ variants }),
  });
  if (res.status === 409) return ORDER_HISTORY_EXISTS;
  if (!res.ok) return SAVE_FAILED;
  return ((await res.json()) as { variants: SavedVariant[] }).variants;
}
