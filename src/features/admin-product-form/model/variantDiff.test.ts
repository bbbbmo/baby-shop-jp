import { describe, expect, it } from "vitest";
import { diffVariants } from "./variantDiff";

const existing = [
  { id: "v1", color: "white", size: "70", stock: 5 },
  { id: "v2", color: "white", size: "80", stock: 3 },
];

describe("diffVariants", () => {
  it("treats variants without an id as inserts", () => {
    const result = diffVariants([], [{ color: "white", size: "70", stock: 5 }]);
    expect(result.toInsert).toEqual([{ color: "white", size: "70", stock: 5 }]);
    expect(result.toUpdate).toEqual([]);
    expect(result.toDeleteIds).toEqual([]);
  });

  it("treats existing ids present in the incoming list as updates", () => {
    const result = diffVariants(existing, [
      { id: "v1", color: "white", size: "70", stock: 9 },
      { id: "v2", color: "white", size: "80", stock: 3 },
    ]);
    expect(result.toUpdate).toEqual([
      { id: "v1", color: "white", size: "70", stock: 9 },
      { id: "v2", color: "white", size: "80", stock: 3 },
    ]);
    expect(result.toDeleteIds).toEqual([]);
  });

  it("treats existing ids missing from the incoming list as deletes", () => {
    const result = diffVariants(existing, [{ id: "v1", color: "white", size: "70", stock: 5 }]);
    expect(result.toDeleteIds).toEqual(["v2"]);
  });

  it("handles a mix of insert/update/delete in one call", () => {
    const result = diffVariants(existing, [
      { id: "v1", color: "white", size: "70", stock: 5 },
      { color: "black", size: "90", stock: 0 },
    ]);
    expect(result.toUpdate).toEqual([{ id: "v1", color: "white", size: "70", stock: 5 }]);
    expect(result.toInsert).toEqual([{ color: "black", size: "90", stock: 0 }]);
    expect(result.toDeleteIds).toEqual(["v2"]);
  });
});
