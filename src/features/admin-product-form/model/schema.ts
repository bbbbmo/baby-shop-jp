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

const productFieldsObjectSchema = z.object({
  brandId: z.string().min(1, "required"),
  category: z.string().refine((value): boolean => isCategorySlug(value), { message: "required" }),
  nameJa: z.string().min(1, "required"),
  nameKo: z.string().min(1, "required"),
  descriptionJa: z.string().optional().default(""),
  descriptionKo: z.string().optional().default(""),
  priceJpy: positiveInt("priceInvalid"),
  listPriceJpy: positiveInt("priceInvalid"),
  // 0은 "값 없음"이라 nonNegativeInt를 쓴다. z.number()로 두면 안 된다 —
  // HTML 숫자 입력은 register()를 거쳐 문자열로 오므로 검증이 항상 터진다.
  priceKrw: nonNegativeInt("priceInvalid"),
  listPriceKrw: nonNegativeInt("priceInvalid"),
  season: z.enum(["ss", "aw", "all"]),
  isNew: z.boolean(),
  isBest: z.boolean(),
  soldOut: z.boolean(),
});

// 원화 판매가와 정가는 함께 채우거나 함께 비운다. 한쪽만 있으면 할인율 계산이
// 깨지고, 0은 "값 없음"을 뜻해 한국 마켓 카탈로그에서 제외된다.
const KRW_PRICE_PAIR_ISSUE = {
  message: "판매가와 정가를 함께 입력해주세요",
  path: ["priceKrw"],
};

const hasKrwPricePair = (v: { priceKrw: number; listPriceKrw: number }): boolean =>
  (v.priceKrw > 0) === (v.listPriceKrw > 0);

export const productFieldsSchema = productFieldsObjectSchema.refine(
  hasKrwPricePair,
  KRW_PRICE_PAIR_ISSUE,
);

export type ProductFieldsValues = z.infer<typeof productFieldsSchema>;

export const productFormSchema = productFieldsObjectSchema
  .extend({ variants: variantsArraySchema })
  .refine(hasKrwPricePair, KRW_PRICE_PAIR_ISSUE);

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const EMPTY_PRODUCT_FORM_VALUES: ProductFormValues = {
  brandId: "",
  category: "",
  nameJa: "",
  nameKo: "",
  descriptionJa: "",
  descriptionKo: "",
  priceJpy: 0,
  listPriceJpy: 0,
  priceKrw: 0,
  listPriceKrw: 0,
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
    price_jpy: v.priceJpy,
    list_price_jpy: v.listPriceJpy,
    price_krw: v.priceKrw > 0 ? v.priceKrw : null,
    list_price_krw: v.listPriceKrw > 0 ? v.listPriceKrw : null,
    season: v.season,
    is_new: v.isNew,
    is_best: v.isBest,
    sold_out: v.soldOut,
  };
}
