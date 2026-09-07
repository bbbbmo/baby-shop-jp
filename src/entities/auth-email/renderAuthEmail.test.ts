import { describe, expect, it } from "vitest";
import { renderAuthEmail } from "./renderAuthEmail";

const link = "https://shop.example/auth/confirm?token_hash=abc&type=signup&next=%2Fjp";
// 속성 안의 &는 &amp;로 적어야 올바른 HTML이다. 브라우저가 원래 값으로 되돌린다.
const hrefOf = (value: string) => `href="${value.replaceAll("&", "&amp;")}"`;

describe("renderAuthEmail", () => {
  it("renders the signup mail in the requested locale with the link inside", () => {
    const mail = renderAuthEmail({ type: "signup", locale: "ko", link });
    expect(mail?.subject).toContain("COMO");
    expect(mail?.subject).toMatch(/이메일/);
    expect(mail?.html).toContain(hrefOf(link));
  });

  it("renders the recovery mail in japanese", () => {
    const mail = renderAuthEmail({ type: "recovery", locale: "ja", link });
    expect(mail?.subject).toMatch(/パスワード/);
    expect(mail?.html).toContain(hrefOf(link));
  });

  it("returns null for actions it has no template for", () => {
    expect(renderAuthEmail({ type: "email_change", locale: "ja", link })).toBeNull();
  });

  it("escapes html in the link so a crafted redirect cannot inject markup", () => {
    const mail = renderAuthEmail({ type: "signup", locale: "ja", link: 'https://a/?x="<b>' });
    expect(mail?.html).not.toContain("<b>");
  });
});
