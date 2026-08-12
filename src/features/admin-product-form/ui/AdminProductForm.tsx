"use client";

import Link from "next/link";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { useAdminProductForm } from "../model/useAdminProductForm";
import { VariantRows } from "./VariantRows";
import { ALL_CATEGORY_SLUGS, getCategoryTitle } from "@/entities/category";
import { FormField } from "@/shared/ui/FormField";
import type { AdminBrand } from "@/shared/api/supabase/admin";
import type { ProductFormValues } from "../model/schema";

type Props = { productId: string | null; defaultValues: ProductFormValues; brands: AdminBrand[] };

export function AdminProductForm({ productId, defaultValues, brands }: Props) {
  const { form, variantFields, onSubmit, submitError } = useAdminProductForm(productId, defaultValues);
  const { register, formState } = form;

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <BasicFields register={register} errors={formState.errors} brands={brands} />
      <FlagFields register={register} />
      <VariantRows register={register} errors={formState.errors} fields={variantFields} />
      {submitError && <p className="text-sm text-sale">저장에 실패했습니다</p>}
      <SubmitBar isSubmitting={formState.isSubmitting} />
    </form>
  );
}

function BasicFields({
  register,
  errors,
  brands,
}: {
  register: UseFormRegister<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  brands: AdminBrand[];
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <BrandSelect register={register} error={errors.brandId?.message} brands={brands} />
      <CategorySelect register={register} error={errors.category?.message} />
      <FormField label="상품명 (일본어)" registration={register("nameJa")} error={errors.nameJa?.message} />
      <FormField label="상품명 (한국어)" registration={register("nameKo")} error={errors.nameKo?.message} />
      <FormField label="설명 (일본어)" registration={register("descriptionJa")} />
      <FormField label="설명 (한국어)" registration={register("descriptionKo")} />
      <FormField label="가격" type="number" registration={register("price")} error={errors.price?.message} />
      <FormField label="정가" type="number" registration={register("listPrice")} error={errors.listPrice?.message} />
      <SeasonSelect register={register} />
    </div>
  );
}

function BrandSelect({
  register,
  error,
  brands,
}: {
  register: UseFormRegister<ProductFormValues>;
  error?: string;
  brands: AdminBrand[];
}) {
  return (
    <label className="block text-sm text-foreground">
      브랜드
      <select {...register("brandId")} className="mt-1 h-11 w-full border border-border bg-surface px-3 text-sm">
        <option value="">선택해 주세요</option>
        {brands.map((b) => (
          <option key={b.id} value={b.id}>{b.nameJa}</option>
        ))}
      </select>
      {error && <span className="mt-1 block text-xs text-sale">{error}</span>}
    </label>
  );
}

function CategorySelect({ register, error }: { register: UseFormRegister<ProductFormValues>; error?: string }) {
  return (
    <label className="block text-sm text-foreground">
      카테고리
      <select {...register("category")} className="mt-1 h-11 w-full border border-border bg-surface px-3 text-sm">
        <option value="">선택해 주세요</option>
        {ALL_CATEGORY_SLUGS.map((slug) => (
          <option key={slug} value={slug}>{getCategoryTitle(slug)}</option>
        ))}
      </select>
      {error && <span className="mt-1 block text-xs text-sale">{error}</span>}
    </label>
  );
}

function SeasonSelect({ register }: { register: UseFormRegister<ProductFormValues> }) {
  return (
    <label className="block text-sm text-foreground">
      시즌
      <select {...register("season")} className="mt-1 h-11 w-full border border-border bg-surface px-3 text-sm">
        <option value="all">사계절</option>
        <option value="ss">봄여름</option>
        <option value="aw">가을겨울</option>
      </select>
    </label>
  );
}

function FlagFields({ register }: { register: UseFormRegister<ProductFormValues> }) {
  return (
    <div className="flex gap-6">
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" {...register("isNew")} className="h-4 w-4 accent-foreground" /> NEW
      </label>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" {...register("isBest")} className="h-4 w-4 accent-foreground" /> BEST
      </label>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" {...register("soldOut")} className="h-4 w-4 accent-foreground" /> 품절
      </label>
    </div>
  );
}

function SubmitBar({ isSubmitting }: { isSubmitting: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <button type="submit" disabled={isSubmitting} className="bg-foreground px-6 py-2.5 text-sm text-white hover:opacity-90 disabled:opacity-40">
        {isSubmitting ? "저장 중..." : "저장"}
      </button>
      <Link href="/admin/products" className="text-sm text-muted underline">목록으로</Link>
    </div>
  );
}
