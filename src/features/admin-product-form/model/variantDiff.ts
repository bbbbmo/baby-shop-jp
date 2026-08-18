import type { VariantInput } from "./schema";

export type ExistingVariant = { id: string; color: string; size: string; stock: number };

export type VariantDiff = {
  toInsert: { color: string; size: string; stock: number }[];
  toUpdate: { id: string; color: string; size: string; stock: number }[];
  toDeleteIds: string[];
};

export function diffVariants(existing: ExistingVariant[], incoming: VariantInput[]): VariantDiff {
  const incomingIds = new Set(incoming.flatMap((v) => (v.id ? [v.id] : [])));
  const existingIds = new Set(existing.map((v) => v.id));
  // 이 상품에 실제로 존재하는 id만 update로 취급한다. 남의 상품 id나 낡은
  // id가 섞여 와도 update가 아니라 insert로 떨어지게(= id를 버리게) 한다.
  const isUpdate = (v: VariantInput): v is ExistingVariant => !!v.id && existingIds.has(v.id);
  return {
    toInsert: incoming.filter((v) => !isUpdate(v)).map(({ color, size, stock }) => ({ color, size, stock })),
    toUpdate: incoming.filter(isUpdate),
    toDeleteIds: existing.filter((v) => !incomingIds.has(v.id)).map((v) => v.id),
  };
}
