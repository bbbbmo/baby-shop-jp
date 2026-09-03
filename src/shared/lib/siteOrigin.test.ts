import { describe, expect, it } from "vitest";
import { resolveSiteOrigin } from "./siteOrigin";

describe("resolveSiteOrigin", () => {
  it("환경변수가 있으면 그것을 쓴다", () => {
    expect(resolveSiteOrigin("https://como.example", "http://localhost:3000/api/x")).toBe(
      "https://como.example",
    );
  });

  it("환경변수의 끝 슬래시를 떼어낸다", () => {
    expect(resolveSiteOrigin("https://como.example/", "http://localhost:3000/api/x")).toBe(
      "https://como.example",
    );
  });

  it("환경변수가 없으면 요청 URL의 오리진을 쓴다", () => {
    expect(resolveSiteOrigin(undefined, "http://localhost:3000/api/payments/start")).toBe(
      "http://localhost:3000",
    );
  });

  it("환경변수가 빈 문자열이면 요청 URL을 쓴다", () => {
    expect(resolveSiteOrigin("", "http://localhost:3000/api/x")).toBe("http://localhost:3000");
  });
});
