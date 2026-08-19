export { useBrands } from "./model/useBrands";
export { AdminProductForm } from "./ui/AdminProductForm";
export { ImageUploader } from "./ui/ImageUploader";
export {
  productFieldsSchema,
  productFormSchema,
  variantsRequestSchema,
  EMPTY_PRODUCT_FORM_VALUES,
  toProductRowPayload,
} from "./model/schema";
export type { ProductFormValues, VariantInput } from "./model/schema";
export { diffVariants } from "./model/variantDiff";
export type { VariantDiff } from "./model/variantDiff";
