import { describe, expect, it } from "vitest";
import { PAYMENT_METHODS } from "./catalog";
import { getProvider } from "./registry";

describe("registry", () => {
  // NODE_ENV=production으로 테스트를 돌리면 레지스트리가 비어 이 단언이 깨진다.
  // vitest는 NODE_ENV=test로 돌므로 평소에는 문제가 없다.
  it("카탈로그가 가리키는 provider가 모두 등록되어 있다", () => {
    for (const method of PAYMENT_METHODS) {
      expect(getProvider(method.provider), method.id).not.toBeNull();
    }
  });

  it("모르는 id는 null이다", () => {
    expect(getProvider("nope")).toBeNull();
  });
});
