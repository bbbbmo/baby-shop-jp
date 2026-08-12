import type { VariantInput } from "./schema";

export type ExistingVariant = { id: string; color: string; size: string; stock: number };

export type VariantDiff = {
  toInsert: { color: string; size: string; stock: number }[];
  toUpdate: { id: string; color: string; size: string; stock: number }[];
  toDeleteIds: string[];
};

export function diffVariants(existing: ExistingVariant[], incoming: VariantInput[]): VariantDiff {
  const incomingIds = new Set(incoming.flatMap((v) => (v.id ? [v.id] : [])));
  return {
    toInsert: incoming.filter((v) => !v.id).map(({ color, size, stock }) => ({ color, size, stock })),
    toUpdate: incoming.filter(
      (v): v is { id: string; color: string; size: string; stock: number } => !!v.id,
    ),
    toDeleteIds: existing.filter((v) => !incomingIds.has(v.id)).map((v) => v.id),
  };
}
