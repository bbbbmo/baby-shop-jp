import { z } from "zod";
import { isCategorySlug } from "@/entities/category";

const positiveInt = (message: string) =>
  z.coerce.number().refine((v) => Number.isInteger(v) && v > 0, { message });

const nonNegativeInt = (message: string) =>
  z.coerce.number().refine((v) => Number.isInteger(v) && v >= 0, { message });

export const variantInputSchema = z.object({
  id: z.string().optional(),
  color: z.string().min(1, "required"),
  size: z.string().min(1, "required"),
  stock: nonNegativeInt("stockInvalid"),
});

export type VariantInput = z.infer<typeof variantInputSchema>;

const hasUniqueColorSize = (variants: { color: string; size: string }[]): boolean =>
  new Set(variants.map((v) => JSON.stringify([v.color, v.size]))).size === variants.length;

// unique (product_id, color, size) 제약을 DB까지 가기 전에 막는다. 폼/라우트가
// 같은 배열 스키마를 공유하므로 검사도 한 곳에만 둔다.
export const variantsArraySchema = z
  .array(variantInputSchema)
  .min(1, "variantsRequired")
  .refine(hasUniqueColorSize, { message: "색상 × 사이즈가 중복된 행이 있습니다" });

export const variantsRequestSchema = z.object({
  variants: variantsArraySchema,
});

export const productFieldsSchema = z.object({
  brandId: z.string().min(1, "required"),
  category: z.string().refine((value): boolean => isCategorySlug(value), { message: "required" }),
  nameJa: z.string().min(1, "required"),
  nameKo: z.string().min(1, "required"),
  descriptionJa: z.string().optional().default(""),
  descriptionKo: z.string().optional().default(""),
  price: positiveInt("priceInvalid"),
  listPrice: positiveInt("priceInvalid"),
  season: z.enum(["ss", "aw", "all"]),
  isNew: z.boolean(),
  isBest: z.boolean(),
  soldOut: z.boolean(),
});

export type ProductFieldsValues = z.infer<typeof productFieldsSchema>;

export const productFormSchema = productFieldsSchema.extend({
  variants: variantsArraySchema,
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const EMPTY_PRODUCT_FORM_VALUES: ProductFormValues = {
  brandId: "",
  category: "",
  nameJa: "",
  nameKo: "",
  descriptionJa: "",
  descriptionKo: "",
  price: 0,
  listPrice: 0,
  season: "all",
  isNew: false,
  isBest: false,
  soldOut: false,
  variants: [],
};

export function toProductRowPayload(v: ProductFieldsValues) {
  return {
    brand_id: v.brandId,
    category: v.category,
    name_ja: v.nameJa,
    name_ko: v.nameKo,
    description_ja: v.descriptionJa || null,
    description_ko: v.descriptionKo || null,
    price: v.price,
    list_price: v.listPrice,
    season: v.season,
    is_new: v.isNew,
    is_best: v.isBest,
    sold_out: v.soldOut,
  };
}
