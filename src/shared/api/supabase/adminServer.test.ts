import { describe, expect, it } from "vitest";
import { sanitizeStorageFilename } from "./adminServer";

describe("sanitizeStorageFilename", () => {
  it("keeps an ASCII-safe filename unchanged", () => {
    expect(sanitizeStorageFilename("photo.png")).toBe("photo.png");
  });

  it("replaces non-ASCII characters so the Storage key upload doesn't fail", () => {
    expect(sanitizeStorageFilename("테스트.png")).toBe("___.png");
  });

  it("replaces spaces and other unsafe punctuation", () => {
    expect(sanitizeStorageFilename("my photo (1).jpg")).toBe("my_photo__1_.jpg");
  });
});
