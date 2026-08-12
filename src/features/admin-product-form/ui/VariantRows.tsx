"use client";

import type { UseFieldArrayReturn, UseFormRegister, FieldErrors } from "react-hook-form";
import type { ProductFormValues } from "../model/schema";

type Props = {
  register: UseFormRegister<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  fields: UseFieldArrayReturn<ProductFormValues, "variants">;
};

export function VariantRows({ register, errors, fields }: Props) {
  const variantsError = variantsErrorMessage(errors);
  return (
    <div>
      <h2 className="mb-2 text-sm font-bold text-foreground">색상 × 사이즈 재고</h2>
      {fields.fields.map((field, index) => (
        <VariantRow key={field.id} index={index} register={register} onRemove={() => fields.remove(index)} />
      ))}
      {variantsError && <p className="text-xs text-sale">{variantsError}</p>}
      <button
        type="button"
        onClick={() => fields.append({ color: "", size: "", stock: 0 })}
        className="mt-2 border border-border px-3 py-1.5 text-xs"
      >
        + 행 추가
      </button>
    </div>
  );
}

function VariantRow({
  index,
  register,
  onRemove,
}: {
  index: number;
  register: UseFormRegister<ProductFormValues>;
  onRemove: () => void;
}) {
  return (
    <div className="mb-2 flex gap-2">
      <input type="hidden" {...register(`variants.${index}.id`)} />
      <input {...register(`variants.${index}.color`)} placeholder="색상" className="h-9 w-32 border border-border px-2 text-sm" />
      <input {...register(`variants.${index}.size`)} placeholder="사이즈" className="h-9 w-24 border border-border px-2 text-sm" />
      <input type="number" {...register(`variants.${index}.stock`)} placeholder="재고" className="h-9 w-24 border border-border px-2 text-sm" />
      <button type="button" onClick={onRemove} className="px-2 text-xs text-sale underline">삭제</button>
    </div>
  );
}

// zod의 array-level min()이 실패하면 react-hook-form이 이 메시지를
// errors.variants.message 또는 errors.variants.root.message 어느 쪽에
// 넣을지 버전에 따라 갈릴 수 있어 둘 다 확인한다.
function variantsErrorMessage(errors: FieldErrors<ProductFormValues>): string | undefined {
  const variantsError = errors.variants as { message?: string; root?: { message?: string } } | undefined;
  return variantsError?.root?.message ?? variantsError?.message;
}
