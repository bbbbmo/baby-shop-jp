import { describe, expect, it } from "vitest";
import { marketPath, stripMarket } from "./marketPath";

describe("marketPath", () => {
  it("prefixes a root path", () => {
    expect(marketPath("kr", "/")).toBe("/kr");
  });

  it("prefixes a nested path", () => {
    expect(marketPath("jp", "/products/girl-top")).toBe("/jp/products/girl-top");
  });

  it("keeps the query string", () => {
    expect(marketPath("kr", "/search?q=%EC%98%B7")).toBe("/kr/search?q=%EC%98%B7");
  });

  it("does not double-prefix an already prefixed path", () => {
    expect(marketPath("kr", "/kr/cart")).toBe("/kr/cart");
  });

  it("re-points a path that carries the other market", () => {
    expect(marketPath("kr", "/jp/cart")).toBe("/kr/cart");
  });

  it("leaves an external url alone", () => {
    expect(marketPath("kr", "https://example.com")).toBe("https://example.com");
  });

  it("leaves an admin path alone", () => {
    expect(marketPath("kr", "/admin/products")).toBe("/admin/products");
  });
});

describe("stripMarket", () => {
  it("removes a market prefix", () => {
    expect(stripMarket("/jp/products")).toBe("/products");
  });

  it("returns root when the path is only a market", () => {
    expect(stripMarket("/kr")).toBe("/");
  });

  it("leaves a path without a market prefix alone", () => {
    expect(stripMarket("/admin/products")).toBe("/admin/products");
  });
});
