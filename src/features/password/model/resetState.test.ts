import { describe, expect, it } from "vitest";
import { primarySocialProvider, resolveResetState } from "./resetState";

describe("resolveResetState", () => {
  it("is expired when the recovery link produced no session", () => {
    expect(resolveResetState({ hasSession: false, providers: [] })).toBe("expired");
    expect(resolveResetState({ hasSession: false, providers: ["email"] })).toBe("expired");
  });

  it("is ready for an email account", () => {
    expect(resolveResetState({ hasSession: true, providers: ["email"] })).toBe("ready");
  });

  it("is ready when the account also has a social login", () => {
    // 같은 이메일로 이메일 가입도 하고 카카오 연동도 한 계정이 있을 수 있다.
    // 비밀번호가 있으므로 재설정할 수 있어야 한다.
    expect(resolveResetState({ hasSession: true, providers: ["email", "kakao"] })).toBe("ready");
  });

  it("is socialOnly for an account with no password", () => {
    // 그대로 updateUser를 부르면 어디에도 잡히지 않는 비밀번호가 생긴다.
    expect(resolveResetState({ hasSession: true, providers: ["kakao"] })).toBe("socialOnly");
  });

  it("is socialOnly when the provider list could not be read", () => {
    // 조회에 실패하면 빈 배열이 온다. 비밀번호를 만들어 주는 쪽보다
    // 막는 쪽으로 틀리는 게 안전하다.
    expect(resolveResetState({ hasSession: true, providers: [] })).toBe("socialOnly");
  });
});

describe("primarySocialProvider", () => {
  it("names the social provider to guide the user to", () => {
    expect(primarySocialProvider(["kakao"])).toBe("kakao");
    expect(primarySocialProvider(["google", "line"])).toBe("google");
  });

  it("ignores the email provider", () => {
    expect(primarySocialProvider(["email", "kakao"])).toBe("kakao");
  });

  it("returns null when there is nothing to name", () => {
    // 화면은 이때 provider 이름 없는 일반 문구를 쓴다.
    expect(primarySocialProvider([])).toBeNull();
    expect(primarySocialProvider(["email"])).toBeNull();
  });
});
