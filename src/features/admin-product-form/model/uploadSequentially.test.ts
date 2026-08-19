import { describe, expect, it } from "vitest";
import { uploadSequentially } from "./uploadSequentially";

describe("uploadSequentially", () => {
  it("never runs two uploads concurrently (avoids racing the server's sort_order read)", async () => {
    let concurrent = 0;
    let maxConcurrent = 0;

    const upload = async (item: number) => {
      concurrent++;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
      await Promise.resolve();
      concurrent--;
      return item * 2;
    };

    const results = await uploadSequentially([1, 2, 3], upload);

    expect(maxConcurrent).toBe(1);
    expect(results).toEqual([2, 4, 6]);
  });
});
