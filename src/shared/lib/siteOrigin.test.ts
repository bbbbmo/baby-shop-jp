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

  it("환경변수에 경로가 붙어 있어도 오리진만 남긴다", () => {
    expect(resolveSiteOrigin("https://como.example/shop", "http://localhost:3000/api/x")).toBe(
      "https://como.example",
    );
  });

  // 오타를 조용히 넘기면 결제 복귀가 엉뚱한 곳으로 간다. 그때 디버깅하는 것보다
  // 서버가 뜰 때 죽는 편이 낫다.
  it("환경변수가 URL이 아니면 던진다", () => {
    expect(() => resolveSiteOrigin("como.example", "http://localhost:3000/api/x")).toThrow();
  });
});
