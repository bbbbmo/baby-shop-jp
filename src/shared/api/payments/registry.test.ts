import { describe, expect, it, vi } from "vitest";
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

  // 이 가드가 하는 일 자체를 고정한다. 위 두 테스트는 "개발에서 mock이 있다"만
  // 증명하고, 정작 중요한 "운영에서 없다"는 덮지 못한다.
  // NODE_ENV를 모듈 최상단에서 읽으므로 모듈을 다시 불러와야 한다.
  it("운영에서는 아무 provider도 등록하지 않는다", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.resetModules();
    const { getProvider: getInProduction } = await import("./registry");
    expect(getInProduction("mock")).toBeNull();
    vi.unstubAllEnvs();
    vi.resetModules();
  });
});
