"use client";

import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { productFormSchema, type ProductFormValues, type VariantInput } from "./schema";
import { adminFetch } from "@/shared/api/adminFetch";

const JSON_HEADERS = { "Content-Type": "application/json" };

// ponytail: zod4의 z.coerce.number()는 입력 타입이 output과 달라(unknown)
// zodResolver의 제네릭 추론이 ProductFormValues와 어긋난다. 여기서만
// Resolver<ProductFormValues>로 단언해 우회한다 — schema.ts(Task 6)는
// 건드리지 않는다.
const resolver = zodResolver(productFormSchema) as Resolver<ProductFormValues>;

export function useAdminProductForm(productId: string | null, defaultValues: ProductFormValues) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<ProductFormValues>({ resolver, defaultValues });
  const variantFields = useFieldArray({ control: form.control, name: "variants" });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    const id = await saveProductFields(productId, values);
    const variantsOk = id ? await saveVariants(id, values.variants) : false;
    if (!id || !variantsOk) {
      setSubmitError("unknownError");
      return;
    }
    if (!productId) router.push(`/admin/products/${id}/edit`);
  });

  return { form, variantFields, onSubmit, submitError };
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

async function saveVariants(productId: string, variants: VariantInput[]): Promise<boolean> {
  const res = await adminFetch(`/api/admin/products/${productId}/variants`, {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify({ variants }),
  });
  return res.ok;
}
