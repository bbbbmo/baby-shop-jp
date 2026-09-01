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

  it("is socialOnly for google and line accounts too", () => {
    // includes("email")을 includes("kakao")로 바꿔도 카카오 케이스만으로는
    // 잡히지 않는다. 구글·라인 계정이 유령 비밀번호를 얻는 걸 막는 테스트다.
    expect(resolveResetState({ hasSession: true, providers: ["google"] })).toBe("socialOnly");
    expect(resolveResetState({ hasSession: true, providers: ["line"] })).toBe("socialOnly");
  });

  it("is unknown when the provider lookup failed", () => {
    // 조회 실패를 소셜 계정과 뭉개면 이메일 가입자에게 "소셜로 가입한
    // 계정"이라고 거짓말하게 된다. 복구 링크는 일회용이라 그 사람은 막힌다.
    expect(resolveResetState({ hasSession: true, providers: null })).toBe("unknown");
  });

  it("is socialOnly when the account genuinely has no identities", () => {
    // 빈 배열은 조회에 성공했는데 가입 경로가 없는 것이다. null과 다르다.
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
