# 비밀번호 변경 · 재설정 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 이메일로 가입한 회원이 로그인 상태에서 비밀번호를 바꾸고, 잊었을 때 메일 링크로 새로 정할 수 있게 한다.

**Architecture:** `features/password` 한 슬라이스에 폼 셋(변경 · 찾기 · 재설정)을 둔다. 셋이 「새 비밀번호 + 확인」 규칙을 공유하므로 나누면 zod 스키마가 세 벌로 복제된다. 화면 분기와 검증은 순수 함수로 빼서 테스트하고, Supabase 호출은 전부 `shared/api/supabase/auth.ts`의 도메인 함수를 거친다. 소셜 전용 계정 판별은 **메일 링크를 탄 뒤**에만 한다 — 로그인 전 화면에서 하면 계정 열거 통로가 된다.

**Tech Stack:** Next.js 16 (App Router) · TypeScript · Supabase (`@supabase/supabase-js` 2.112) · react-hook-form + zod 4 · TanStack Query · vitest

**설계 문서:** [`docs/specs/2026-09-01-password-management-design.md`](../specs/2026-09-01-password-management-design.md)

---

## 시작 전에 읽을 것

- `src/features/signin-form/` — 폼 슬라이스의 표준 모양 (`Form.tsx` + `model/schema.ts` + `model/use*Form.ts` + `index.ts`)
- `src/views/mypage/ProfileCard.tsx` — 접힘/펼침 카드 패턴. 비밀번호 카드가 이걸 따라간다
- `src/app/[market]/auth/callback/page.tsx` — 메일·OAuth에서 돌아오는 화면의 표준. **코드를 직접 교환하지 않는다**는 주석을 반드시 읽을 것
- `src/shared/api/supabase/auth.ts` — 모든 Supabase 인증 호출이 여기 모인다. 상위 레이어는 `supabase-js`를 직접 import하지 않는다 (CLAUDE.md 규칙)

**CLAUDE.md 제약:** 함수 15줄 · 중첩 3단계 · `border-radius: 0` · `rounded-*` 금지 · CTA는 `bg-foreground`.

---

## 파일 구조

### 새로 만드는 파일

| 파일 | 책임 |
| --- | --- |
| `src/features/password/model/schema.ts` | 비밀번호 규칙 세 벌 (찾기 · 재설정 · 변경). 규칙이 사는 유일한 곳 |
| `src/features/password/model/schema.test.ts` | 위 규칙 테스트 |
| `src/features/password/model/resetState.ts` | 재설정 화면 세 갈래 판단 (순수) |
| `src/features/password/model/resetState.test.ts` | 위 판단 테스트 |
| `src/features/password/model/useIdentityProviders.ts` | 가입 경로 조회 (TanStack Query) |
| `src/features/password/model/useChangePasswordForm.ts` | 변경 폼 상태 |
| `src/features/password/model/useForgotPasswordForm.ts` | 찾기 폼 상태 |
| `src/features/password/model/useResetPasswordForm.ts` | 재설정 폼 상태 |
| `src/features/password/ChangePasswordCard.tsx` | 마이페이지 카드. 조회중 · 소셜안내 · 접힘 · 펼침 네 상태 |
| `src/features/password/ForgotPasswordForm.tsx` | 메일 요청 폼 |
| `src/features/password/ResetPasswordForm.tsx` | 새 비밀번호 입력 폼 |
| `src/features/password/index.ts` | 슬라이스 공개 API |
| `src/views/forgot-password/ForgotPasswordView.tsx` | 찾기 화면 |
| `src/views/reset-password/ResetPasswordView.tsx` | 재설정 화면 (세 갈래 분기) |
| `src/app/[market]/forgot-password/page.tsx` | 라우트 |
| `src/app/[market]/auth/reset-password/page.tsx` | 라우트 |

**설계 문서와 다른 점 하나.** 설계서는 `ChangePasswordForm.tsx`라고 적었지만 실제로는 폼 하나가 아니라 네 상태를 가진 카드라서 `ChangePasswordCard.tsx`로 만든다. Task 9에서 설계서를 이에 맞춰 고친다.

### 고치는 파일

| 파일 | 무엇을 |
| --- | --- |
| `src/shared/api/supabase/auth.ts` | 함수 4개 추가 + `mapAuthError`를 표로 바꿈 |
| `src/shared/api/supabase/index.ts` | 새 함수 공개 |
| `src/shared/i18n/dictionaries.ts` | `password` 블록 추가 (ja · ko) |
| `src/views/mypage/MypageView.tsx` | `ProfileCard` 아래에 `ChangePasswordCard` 배치 |
| `src/features/signin-form/SigninForm.tsx` | 「비밀번호를 잊으셨나요?」 링크 |

---

## Task 1: 비밀번호 규칙

세 화면이 공유하는 zod 스키마. **회원가입과 같은 8자 규칙**이어야 한다 — 가입 때 통과한 비밀번호가 변경 화면에서 거부되면 사용자가 이유를 알 수 없다.

**Files:**
- Create: `src/features/password/model/schema.ts`
- Test: `src/features/password/model/schema.test.ts`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/features/password/model/schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./schema";

// zod는 첫 실패만 주는 게 아니라 issues 배열을 준다. 어떤 칸에서 어떤 코드가
// 났는지 봐야 화면 문구가 맞는지 알 수 있다.
function issue(schema: { safeParse: (v: unknown) => unknown }, values: unknown, field: string) {
  const result = schema.safeParse(values) as
    | { success: true }
    | { success: false; error: { issues: { path: (string | number)[]; message: string }[] } };
  if (result.success) return undefined;
  return result.error.issues.find((i) => i.path[0] === field)?.message;
}

describe("forgotPasswordSchema", () => {
  it("accepts an email address", () => {
    expect(forgotPasswordSchema.safeParse({ email: "a@example.com" }).success).toBe(true);
  });

  it("rejects an empty email", () => {
    expect(issue(forgotPasswordSchema, { email: "" }, "email")).toBe("required");
  });

  it("rejects a malformed email", () => {
    expect(issue(forgotPasswordSchema, { email: "not-an-email" }, "email")).toBe("invalidEmail");
  });
});

describe("resetPasswordSchema", () => {
  const valid = { password: "newpassword1", passwordConfirm: "newpassword1" };

  it("accepts a matching pair", () => {
    expect(resetPasswordSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a password shorter than the signup rule", () => {
    // 회원가입이 8자를 요구한다. 여기서만 느슨하면 가입은 되는데 재설정은
    // 안 되는(또는 그 반대) 상황이 생긴다.
    const short = { password: "short1", passwordConfirm: "short1" };
    expect(issue(resetPasswordSchema, short, "password")).toBe("passwordTooShort");
  });

  it("reports a mismatch on the confirm field", () => {
    const mismatch = { password: "newpassword1", passwordConfirm: "newpassword2" };
    expect(issue(resetPasswordSchema, mismatch, "passwordConfirm")).toBe("passwordMismatch");
  });
});

describe("changePasswordSchema", () => {
  const valid = {
    currentPassword: "oldpassword1",
    password: "newpassword1",
    passwordConfirm: "newpassword1",
  };

  it("accepts a current password plus a new matching pair", () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it("requires the current password", () => {
    expect(issue(changePasswordSchema, { ...valid, currentPassword: "" }, "currentPassword")).toBe(
      "required",
    );
  });

  it("rejects a new password identical to the current one", () => {
    // Supabase가 same_password로 거절한다. 왕복하기 전에 잡아야
    // 사용자가 네트워크를 기다린 끝에 거절당하지 않는다.
    const same = {
      currentPassword: "oldpassword1",
      password: "oldpassword1",
      passwordConfirm: "oldpassword1",
    };
    expect(issue(changePasswordSchema, same, "password")).toBe("samePassword");
  });

  it("still checks the new password rules", () => {
    const short = { currentPassword: "oldpassword1", password: "short1", passwordConfirm: "short1" };
    expect(issue(changePasswordSchema, short, "password")).toBe("passwordTooShort");
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npx vitest run src/features/password/model/schema.test.ts`
Expected: FAIL — `Cannot find module './schema'`

- [ ] **Step 3: 스키마를 만든다**

`src/features/password/model/schema.ts`:

```ts
import { z } from "zod";

// 회원가입(features/signup-form/model/schema.ts)과 같은 8자 규칙이어야 한다.
// 가입 때 통과한 비밀번호가 변경 화면에서 거부되면 사용자가 이유를 알 수 없다.
// 오류 코드도 가입과 같은 이름을 쓴다 — 사전 문구를 재활용할 수 있다.
const newPassword = z.string().min(8, "passwordTooShort");
const newPasswordConfirm = z.string().min(1, "required");

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "required").email("invalidEmail"),
});

export const resetPasswordSchema = z
  .object({ password: newPassword, passwordConfirm: newPasswordConfirm })
  .refine((v) => v.password === v.passwordConfirm, {
    message: "passwordMismatch",
    path: ["passwordConfirm"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "required"),
    password: newPassword,
    passwordConfirm: newPasswordConfirm,
  })
  .refine((v) => v.password === v.passwordConfirm, {
    message: "passwordMismatch",
    path: ["passwordConfirm"],
  })
  // 같은 값이면 Supabase가 same_password로 거절한다. 왕복 전에 잡는다.
  .refine((v) => v.currentPassword !== v.password, {
    message: "samePassword",
    path: ["password"],
  });

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export const initialForgotPasswordFormValues: ForgotPasswordFormValues = { email: "" };

export const initialResetPasswordFormValues: ResetPasswordFormValues = {
  password: "",
  passwordConfirm: "",
};

export const initialChangePasswordFormValues: ChangePasswordFormValues = {
  currentPassword: "",
  password: "",
  passwordConfirm: "",
};
```

- [ ] **Step 4: 통과를 확인한다**

Run: `npx vitest run src/features/password/model/schema.test.ts`
Expected: PASS — 10 tests

- [ ] **Step 5: 커밋**

```bash
git add src/features/password/model/schema.ts src/features/password/model/schema.test.ts
git commit -m "feat(password): 비밀번호 입력 규칙을 한 곳에 모은다

- 변경·찾기·재설정 세 화면이 같은 '새 비밀번호 + 확인' 규칙을 쓴다.
  슬라이스를 나누면 이 규칙이 세 벌로 복제돼 한쪽만 고치는 사고가 난다
- 8자 규칙과 오류 코드 이름을 회원가입과 맞췄다. 가입 때 통과한 비밀번호가
  변경 화면에서 거부되면 사용자가 이유를 알 수 없다
- 현재 비밀번호와 같은 값을 미리 거른다. Supabase가 same_password로 거절하는데,
  왕복을 기다린 끝에 거절당하는 것보다 즉시 알려주는 게 낫다"
```

---

## Task 2: 재설정 화면 갈래 판단

재설정 화면은 세 가지 중 하나를 보여준다. 분기를 렌더링에서 떼어내야 테스트할 수 있다. `src/entities/auth/postAuthDestination.ts`가 같은 모양이니 참고하라.

**Files:**
- Create: `src/features/password/model/resetState.ts`
- Test: `src/features/password/model/resetState.test.ts`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/features/password/model/resetState.test.ts`:

```ts
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
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npx vitest run src/features/password/model/resetState.test.ts`
Expected: FAIL — `Cannot find module './resetState'`

- [ ] **Step 3: 판단 함수를 만든다**

`src/features/password/model/resetState.ts`:

```ts
// 재설정 링크를 타고 온 화면이 무엇을 보여줄지 정한다.
// entities/auth/postAuthDestination.ts와 같은 모양의 순수 판단 함수다.
export type ResetState = "expired" | "socialOnly" | "ready";

// 소셜 로그인 계정에는 비밀번호가 없다. 그대로 updateUser를 부르면 identities에
// 잡히지 않는 비밀번호가 생긴다(supabase/discussions#37737의 ghost password).
// 조회에 실패해 providers가 비어 오면 막는 쪽으로 틀린다.
export function resolveResetState(input: {
  hasSession: boolean;
  providers: string[];
}): ResetState {
  if (!input.hasSession) {
    return "expired";
  }
  return input.providers.includes("email") ? "ready" : "socialOnly";
}

// 안내할 소셜 서비스 이름. 여러 개면 첫 번째를 쓴다.
// 고를 게 없으면 null — 화면이 이름 없는 일반 문구로 떨어진다.
export function primarySocialProvider(providers: string[]): string | null {
  return providers.find((provider) => provider !== "email") ?? null;
}
```

- [ ] **Step 4: 통과를 확인한다**

Run: `npx vitest run src/features/password/model/resetState.test.ts`
Expected: PASS — 8 tests

- [ ] **Step 5: 커밋**

```bash
git add src/features/password/model/resetState.ts src/features/password/model/resetState.test.ts
git commit -m "feat(password): 재설정 화면의 세 갈래를 순수 함수로 뺀다

- 만료·소셜계정·정상 세 가지를 렌더링 안에서 가르면 테스트할 수 없다
- 가입 경로 조회가 실패해 목록이 비어 오면 소셜 계정으로 취급한다.
  비밀번호를 만들어 주는 쪽으로 틀리면 어디에도 잡히지 않는 비밀번호가 남는다
- 이메일과 카카오를 둘 다 가진 계정은 비밀번호가 있으므로 재설정을 허용한다"
```

---

## Task 3: Supabase 인증 함수 4개

상위 레이어가 `supabase-js`를 직접 보지 않도록 `auth.ts`에만 호출을 둔다 (CLAUDE.md 규칙).

**Files:**
- Modify: `src/shared/api/supabase/auth.ts`
- Modify: `src/shared/api/supabase/index.ts`

- [ ] **Step 1: `mapAuthError`를 표로 바꾼다**

지금은 `if`가 넷이라 코드를 하나 더 넣으면 함수가 15줄을 넘는다(CLAUDE.md 제약). 표로 바꾸면 항목을 늘려도 함수가 자라지 않는다.

`src/shared/api/supabase/auth.ts` 맨 아래의 `mapAuthError` 전체를 다음으로 교체한다.

```ts
const AUTH_ERROR_CODES: Record<string, string> = {
  user_already_exists: "emailAlreadyExists",
  email_exists: "emailAlreadyExists",
  weak_password: "passwordTooWeak",
  invalid_credentials: "invalidCredentials",
  email_not_confirmed: "emailNotConfirmed",
  // 새 비밀번호가 기존과 같을 때. 폼에서 미리 거르지만 서버도 거절한다.
  same_password: "samePassword",
};

// 알려진 케이스가 아니면 원래 코드(없으면 에러 클래스 이름)를 그대로
// 내보낸다. UI는 어차피 errors[code] ?? errors.unknownError로 안전하게
// 폴백해 문구는 그대로면서, URL(authError=...)에 실제 원인이 남아 다음
// 재현 때 바로 알 수 있다.
function mapAuthError(error: AuthError): string {
  return AUTH_ERROR_CODES[error.code ?? ""] ?? error.code ?? error.name ?? "unknownError";
}
```

- [ ] **Step 2: 기존 인증이 안 깨졌는지 확인한다**

Run: `npx tsc --noEmit && npx vitest run`
Expected: tsc 통과, 기존 테스트 전부 통과 (`adminServer.test.ts` 1건 실패는 `.env.local`이 없어서 나는 기존 실패다. 그대로 두라)

- [ ] **Step 3: 함수 4개를 추가한다**

`src/shared/api/supabase/auth.ts`의 `updateProfile` 아래, `subscribeToAuthChanges` 위에 넣는다.

```ts
// current_password를 함께 넘기면 GoTrue가 서버에서 검증한다. 클라이언트에서
// signInWithPassword로 확인하는 방식은 개발자도구로 우회할 수 있고,
// 실패한 로그인 시도 기록도 지저분해진다.
export async function changePassword(params: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.updateUser({
    current_password: params.currentPassword,
    password: params.newPassword,
  });
  return { error: error ? mapAuthError(error) : null };
}

// 가입되지 않은 주소여도 Supabase는 메일을 안 보내고 에러도 내지 않는다.
// 계정 열거 방지가 기본으로 들어 있으므로 호출부는 결과를 구분하지 말 것.
export async function requestPasswordReset(
  email: string,
  redirectTo: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  return { error: error ? mapAuthError(error) : null };
}

// 비밀번호를 새로 정하고 다른 기기의 세션을 끊는다. 비밀번호를 잊어 재설정하는
// 상황은 계정을 빼앗겼을 가능성이 있어서다. scope "others"는 이 기기는 남긴다.
// 이미 발급된 access token은 만료 전까지 살아 있다 — 끊기는 건 refresh token이다.
export async function resetPassword(newPassword: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    return { error: mapAuthError(error) };
  }
  await supabase.auth.signOut({ scope: "others" });
  return { error: null };
}

// 가입 경로 목록 ("email" · "kakao" · "google" · "line").
// 세션 안의 user 객체가 identities를 담는다는 보장이 없어 getUser()로 서버에
// 물어본다. 실패하면 빈 배열 — 호출부는 이를 "비밀번호 없음"으로 취급한다.
export async function getIdentityProviders(): Promise<string[]> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return [];
  }
  return (data.user.identities ?? []).map((identity) => identity.provider);
}
```

- [ ] **Step 4: 슬라이스 공개 API에 추가한다**

`src/shared/api/supabase/index.ts`의 `./auth` export 목록에 네 이름을 넣는다.

```ts
export {
  signUpWithEmail,
  signInWithEmail,
  signInWithOAuth,
  hasSession,
  signOut,
  updateProfile,
  changePassword,
  requestPasswordReset,
  resetPassword,
  getIdentityProviders,
  subscribeToAuthChanges,
  type SignUpParams,
  type User,
} from "./auth";
```

- [ ] **Step 5: 타입 검사**

Run: `npx tsc --noEmit`
Expected: 통과. `current_password`와 `scope: "others"`가 타입에 없다고 나오면 `@supabase/supabase-js` 버전이 2.112 미만인지 확인하라.

- [ ] **Step 6: 커밋**

```bash
git add src/shared/api/supabase/auth.ts src/shared/api/supabase/index.ts
git commit -m "feat(password): 비밀번호 변경·재설정 Supabase 함수를 추가한다

- 상위 레이어가 supabase-js를 직접 보지 않도록 auth.ts에만 호출을 둔다
- 현재 비밀번호 검증을 서버에 맡긴다. 클라이언트에서 로그인 한 번 더 해보는
  방식은 개발자도구로 우회할 수 있다
- 재설정에서만 다른 기기를 끊는다. 잊어서 재설정하는 상황은 계정을 빼앗겼을
  가능성이 있다. 마이페이지에서 자발적으로 바꾸는 건 본인이 이미 로그인한
  상황이라 끊지 않는다 — 휴대폰이 이유 없이 로그아웃되는 짜증을 주지 않는다
- mapAuthError를 표로 바꿨다. if를 하나 더 넣으면 함수가 15줄을 넘는다"
```

---

## Task 4: 문구 (i18n)

세 화면이 같은 오류 문구(필수 · 8자 · 불일치)를 쓴다. 화면별로 블록을 나누면 오류 문구가 세 벌이 되므로 **`password` 블록 하나에 `change` · `forgot` · `reset` 하위와 공용 `errors`를 둔다.**

**Files:**
- Modify: `src/shared/i18n/dictionaries.ts`

- [ ] **Step 1: 일본어 블록을 넣는다**

일본어 사전의 `mypage: { ... },` 블록 **바로 뒤**에 붙인다.

```ts
    password: {
      providers: { kakao: "カカオ", google: "Google", line: "LINE" },
      change: {
        title: "パスワード",
        openButton: "パスワードを変更",
        currentLabel: "現在のパスワード",
        newLabel: "新しいパスワード",
        confirmLabel: "新しいパスワード（確認）",
        submit: "変更する",
        submitting: "変更中…",
        cancel: "キャンセル",
        done: "パスワードを変更しました。",
        socialNotice: "{provider}でログイン中です。パスワードは{provider}で管理されます。",
        socialNoticeGeneric: "パスワードでログインするアカウントではありません。",
      },
      forgot: {
        title: "パスワードをお忘れの方",
        description: "ご登録のメールアドレスに再設定リンクをお送りします。",
        emailLabel: "メールアドレス",
        submit: "再設定メールを送る",
        submitting: "送信中…",
        sentTitle: "メールを送信しました",
        sentDescription:
          "メール内のリンクからパスワードを再設定してください。届かない場合は迷惑メールフォルダをご確認ください。",
        backToSignin: "ログインに戻る",
      },
      reset: {
        title: "新しいパスワードの設定",
        newLabel: "新しいパスワード",
        confirmLabel: "新しいパスワード（確認）",
        submit: "パスワードを設定",
        submitting: "設定中…",
        checking: "確認しています…",
        expiredTitle: "リンクの有効期限が切れています",
        expiredDescription: "お手数ですが、もう一度お手続きください。",
        requestAgain: "もう一度リクエストする",
        socialTitle: "パスワードのないアカウントです",
        socialDescription: "{provider}で登録されたアカウントです。{provider}でログインしてください。",
        socialDescriptionGeneric: "パスワードでログインするアカウントではありません。",
        goToSignin: "ログイン画面へ",
      },
      errors: {
        required: "必須項目です",
        invalidEmail: "メールアドレスの形式が正しくありません",
        passwordTooShort: "パスワードは8文字以上で入力してください",
        passwordTooWeak: "パスワードが簡単すぎます",
        passwordMismatch: "パスワードが一致しません",
        samePassword: "現在のパスワードと同じです",
        invalidCredentials: "現在のパスワードが正しくありません",
        unknownError: "エラーが発生しました。もう一度お試しください",
      },
    },
```

- [ ] **Step 2: 한국어 블록을 넣는다**

한국어 사전의 `mypage: { ... },` 블록 **바로 뒤**에 붙인다.

```ts
    password: {
      providers: { kakao: "카카오", google: "Google", line: "LINE" },
      change: {
        title: "비밀번호",
        openButton: "비밀번호 변경",
        currentLabel: "현재 비밀번호",
        newLabel: "새 비밀번호",
        confirmLabel: "새 비밀번호 확인",
        submit: "변경하기",
        submitting: "변경 중…",
        cancel: "취소",
        done: "비밀번호를 변경했어요.",
        socialNotice: "{provider}로 로그인 중이에요. 비밀번호는 {provider}에서 관리해요.",
        socialNoticeGeneric: "비밀번호로 로그인하는 계정이 아니에요.",
      },
      forgot: {
        title: "비밀번호 찾기",
        description: "가입하신 이메일로 재설정 링크를 보내드려요.",
        emailLabel: "이메일",
        submit: "재설정 메일 받기",
        submitting: "보내는 중…",
        sentTitle: "메일을 보냈어요",
        sentDescription:
          "메일 속 링크에서 비밀번호를 다시 정해주세요. 안 보이면 스팸함도 확인해주세요.",
        backToSignin: "로그인으로 돌아가기",
      },
      reset: {
        title: "새 비밀번호 설정",
        newLabel: "새 비밀번호",
        confirmLabel: "새 비밀번호 확인",
        submit: "비밀번호 설정",
        submitting: "설정 중…",
        checking: "확인 중이에요…",
        expiredTitle: "링크가 만료됐어요",
        expiredDescription: "번거롭지만 다시 요청해주세요.",
        requestAgain: "다시 요청하기",
        socialTitle: "비밀번호가 없는 계정이에요",
        socialDescription: "{provider}로 가입한 계정이에요. {provider}로 로그인해주세요.",
        socialDescriptionGeneric: "비밀번호로 로그인하는 계정이 아니에요.",
        goToSignin: "로그인 화면으로",
      },
      errors: {
        required: "필수 입력 항목이에요",
        invalidEmail: "이메일 형식이 올바르지 않아요",
        passwordTooShort: "비밀번호는 8자 이상으로 입력해주세요",
        passwordTooWeak: "비밀번호가 너무 단순해요",
        passwordMismatch: "비밀번호가 일치하지 않아요",
        samePassword: "현재 비밀번호와 같아요",
        invalidCredentials: "현재 비밀번호가 올바르지 않아요",
        unknownError: "오류가 발생했어요. 다시 시도해주세요",
      },
    },
```

- [ ] **Step 3: 로그인 화면 문구를 하나 추가한다**

Task 6에서 「비밀번호를 잊으셨나요?」 링크를 붙인다. 두 사전의 `signin` 블록에 한 줄씩 넣는다.

일본어 `signin`의 `signupLink` 아래:
```ts
      forgotPasswordLink: "パスワードをお忘れですか？",
```

한국어 `signin`의 `signupLink` 아래:
```ts
      forgotPasswordLink: "비밀번호를 잊으셨나요?",
```

- [ ] **Step 4: 두 사전이 같은 모양인지 확인한다**

`Dictionary` 타입은 일본어 객체에서 뽑아낸다. 한국어에 키가 빠지면 tsc가 잡는다.

Run: `npx tsc --noEmit`
Expected: 통과

- [ ] **Step 5: 커밋**

```bash
git add src/shared/i18n/dictionaries.ts
git commit -m "docs(i18n): 비밀번호 화면 문구를 추가한다

- 화면별로 블록을 나누면 '필수'·'8자 이상'·'일치하지 않음' 문구가 세 벌이
  된다. password 블록 하나에 공용 errors를 두고 화면별 하위만 나눴다
- 소셜 안내는 {provider} 자리표시자를 쓴다. 카카오·구글·라인마다 문장을
  복제하면 문구를 고칠 때 하나를 빠뜨린다"
```

---

## Task 5: 비밀번호 변경 카드 (마이페이지)

**Files:**
- Create: `src/features/password/model/useIdentityProviders.ts`
- Create: `src/features/password/model/useChangePasswordForm.ts`
- Create: `src/features/password/ChangePasswordCard.tsx`
- Create: `src/features/password/index.ts`
- Modify: `src/views/mypage/MypageView.tsx`

- [ ] **Step 1: 가입 경로 조회 훅을 만든다**

`src/features/password/model/useIdentityProviders.ts`:

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getIdentityProviders } from "@/shared/api/supabase";

// 이 계정이 어떤 방법으로 가입했는지. 비밀번호가 있는 계정인지 판단하는 데 쓴다.
export function useIdentityProviders() {
  return useQuery({ queryKey: ["identityProviders"], queryFn: getIdentityProviders });
}
```

- [ ] **Step 2: 폼 상태 훅을 만든다**

`src/features/password/model/useChangePasswordForm.ts`:

```ts
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePassword } from "@/shared/api/supabase";
import {
  changePasswordSchema,
  initialChangePasswordFormValues,
  type ChangePasswordFormValues,
} from "./schema";

export function useChangePasswordForm(onSuccess: () => void) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: initialChangePasswordFormValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const { error } = await changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.password,
    });
    if (error) {
      setSubmitError(error);
      return;
    }
    // 비밀번호가 폼 상태에 남지 않게 지운다.
    reset(initialChangePasswordFormValues);
    onSuccess();
  });

  return { register, errors, isSubmitting, submitError, onSubmit, reset };
}
```

- [ ] **Step 3: provider 이름 변환기를 만든다**

`src/features/password/model/providerLabel.ts`:

```ts
import type { Dictionary } from "@/shared/i18n/dictionaries";

type ProviderKey = keyof Dictionary["password"]["providers"];

// 사전에 없는 provider가 와도 화면이 비지 않게 원래 문자열을 그대로 쓴다.
export function providerLabel(d: Dictionary, provider: string): string {
  return d.password.providers[provider as ProviderKey] ?? provider;
}
```

- [ ] **Step 4: 카드를 만든다**

`src/features/password/ChangePasswordCard.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import { FormField } from "@/shared/ui/FormField";
import { useIdentityProviders } from "./model/useIdentityProviders";
import { useChangePasswordForm } from "./model/useChangePasswordForm";
import { primarySocialProvider } from "./model/resetState";
import { providerLabel } from "./model/providerLabel";

// 마이페이지의 비밀번호 카드. 소셜 계정에는 비밀번호가 없으므로 입력란 대신
// 어디서 관리하는지 알려준다. 본인이 로그인한 화면이라 가입 경로를 밝혀도 된다.
export function ChangePasswordCard() {
  const { d } = useLocale();
  const { data: providers, isLoading } = useIdentityProviders();

  if (isLoading || !providers) {
    return null;
  }
  if (!providers.includes("email")) {
    return <SocialNotice provider={primarySocialProvider(providers)} />;
  }
  return (
    <section className="mt-8 border-t border-border pt-6">
      <h2 className="mb-4 text-sm font-medium text-foreground">{d.password.change.title}</h2>
      <ChangePasswordBody />
    </section>
  );
}

function SocialNotice({ provider }: { provider: string | null }) {
  const { d } = useLocale();
  const text = provider
    ? d.password.change.socialNotice.replaceAll("{provider}", providerLabel(d, provider))
    : d.password.change.socialNoticeGeneric;
  return (
    <section className="mt-8 border-t border-border pt-6">
      <h2 className="mb-2 text-sm font-medium text-foreground">{d.password.change.title}</h2>
      <p className="text-sm text-muted">{text}</p>
    </section>
  );
}

// 접힘/펼침은 바로 위 ProfileCard의 「정보 수정」과 같은 방식이다.
function ChangePasswordBody() {
  const { d } = useLocale();
  const [editing, setEditing] = useState(false);
  const [done, setDone] = useState(false);
  const form = useChangePasswordForm(() => {
    setEditing(false);
    setDone(true);
  });

  if (!editing) {
    return (
      <div className="space-y-3">
        {done && <p className="text-sm text-muted">{d.password.change.done}</p>}
        <button
          type="button"
          onClick={() => openEditor(form.reset, setDone, setEditing)}
          className="w-full border border-border py-3 text-sm font-medium text-foreground hover:bg-sand"
        >
          {d.password.change.openButton}
        </button>
      </div>
    );
  }
  return <ChangePasswordFields form={form} onCancel={() => setEditing(false)} />;
}

// 다시 열 때 이전 입력과 "변경했어요" 안내가 남아 있으면 안 된다.
function openEditor(
  reset: () => void,
  setDone: (v: boolean) => void,
  setEditing: (v: boolean) => void,
): void {
  reset();
  setDone(false);
  setEditing(true);
}

function ChangePasswordFields({
  form,
  onCancel,
}: {
  form: ReturnType<typeof useChangePasswordForm>;
  onCancel: () => void;
}) {
  const { d } = useLocale();
  const { register, errors, isSubmitting, submitError, onSubmit } = form;
  const errorText = (key: string | undefined) =>
    key
      ? (d.password.errors[key as keyof typeof d.password.errors] ?? d.password.errors.unknownError)
      : undefined;

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormField
        label={d.password.change.currentLabel}
        type="password"
        registration={register("currentPassword")}
        error={errorText(errors.currentPassword?.message)}
      />
      <FormField
        label={d.password.change.newLabel}
        type="password"
        registration={register("password")}
        error={errorText(errors.password?.message)}
      />
      <FormField
        label={d.password.change.confirmLabel}
        type="password"
        registration={register("passwordConfirm")}
        error={errorText(errors.passwordConfirm?.message)}
      />
      {submitError && <p className="text-sm text-sale">{errorText(submitError)}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 border border-border py-3 text-sm font-medium text-foreground hover:bg-sand disabled:cursor-not-allowed disabled:opacity-40"
        >
          {d.password.change.cancel}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-foreground py-3 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? d.password.change.submitting : d.password.change.submit}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 5: 슬라이스 공개 API를 만든다**

`src/features/password/index.ts`:

```ts
export { ChangePasswordCard } from "./ChangePasswordCard";
```

(Task 6·7에서 `ForgotPasswordForm` · `ResetPasswordForm`을 여기에 추가한다.)

- [ ] **Step 6: 마이페이지에 배치한다**

`src/views/mypage/MypageView.tsx`의 import에 추가:

```ts
import { ChangePasswordCard } from "@/features/password";
```

`MypageContent`의 `<ProfileCard ... />` 바로 다음 줄에 넣는다:

```tsx
        <ProfileCard email={email} name={name} furigana={furigana} phone={phone} />
        <ChangePasswordCard />
        {!isLoading && <OrderHistory orders={orders} />}
```

- [ ] **Step 7: 타입·린트 확인**

Run: `npx tsc --noEmit && npx eslint src`
Expected: tsc 통과. eslint는 `FontModeProvider.tsx` 오류 1건만 — 이건 기존 오류다. 새 오류가 나오면 고쳐라.

- [ ] **Step 8: 브라우저에서 확인한다**

```bash
rm -rf .next && pnpm dev
```

첫 컴파일에 30~40초 걸린다. 무한 로딩이 아니다.

이메일로 가입한 계정으로 `/kr/signin` 로그인 → `/kr/mypage`에서 확인할 것

1. 「비밀번호」 카드가 프로필 아래에 보인다
2. 「비밀번호 변경」을 누르면 세 칸이 펼쳐진다
3. 현재 비밀번호를 **틀리게** 넣고 제출 → 오류가 뜨고 화면이 그대로다
4. **이때 브라우저 콘솔/네트워크 탭에서 실제 에러 코드를 확인하라.** 사전의 `invalidCredentials`가 아닌 다른 코드면 Task 3의 `AUTH_ERROR_CODES`에 그 코드를 추가하고 커밋에 남겨라
5. 새 비밀번호를 현재와 **같게** 넣으면 「현재 비밀번호와 같아요」가 뜬다 (네트워크 요청 없이)
6. 정상 입력 → 카드가 접히고 「비밀번호를 변경했어요」가 뜬다
7. 로그아웃 후 **새 비밀번호로 로그인된다**

- [ ] **Step 9: 커밋**

```bash
git add src/features/password src/views/mypage/MypageView.tsx
git commit -m "feat(password): 마이페이지에서 비밀번호를 바꿀 수 있게 한다

- 소셜 계정에는 비밀번호가 없어 입력란 대신 어디서 관리하는지 안내한다.
  로그인한 본인이 보는 화면이라 가입 경로를 밝혀도 된다
- 접힘/펼침은 바로 위 ProfileCard의 '정보 수정'과 같은 방식으로 맞췄다
- 다시 열 때 이전 입력과 완료 안내를 지운다. 비밀번호가 폼 상태에 남아 있으면
  안 되고, 지난번 '변경했어요'가 그대로 붙어 있으면 방금 바꾼 걸로 착각한다"
```

---

## Task 6: 비밀번호 찾기 화면

**Files:**
- Create: `src/features/password/model/useForgotPasswordForm.ts`
- Create: `src/features/password/ForgotPasswordForm.tsx`
- Create: `src/views/forgot-password/ForgotPasswordView.tsx`
- Create: `src/app/[market]/forgot-password/page.tsx`
- Modify: `src/features/password/index.ts`
- Modify: `src/features/signin-form/SigninForm.tsx`

- [ ] **Step 1: 폼 상태 훅을 만든다**

`src/features/password/model/useForgotPasswordForm.ts`:

```ts
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { requestPasswordReset } from "@/shared/api/supabase";
import { marketPath, useMarket } from "@/shared/market";
import {
  forgotPasswordSchema,
  initialForgotPasswordFormValues,
  type ForgotPasswordFormValues,
} from "./schema";

export function useForgotPasswordForm(onSent: () => void) {
  const market = useMarket();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: initialForgotPasswordFormValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    // 마켓을 붙여야 /jp에서 요청한 사람이 일본어 화면으로 돌아온다.
    const redirectTo = `${window.location.origin}${marketPath(market, "/auth/reset-password")}`;
    const { error } = await requestPasswordReset(values.email, redirectTo);
    if (error) {
      setSubmitError(error);
      return;
    }
    onSent();
  });

  return { register, errors, isSubmitting, submitError, onSubmit };
}
```

- [ ] **Step 2: 폼을 만든다**

`src/features/password/ForgotPasswordForm.tsx`:

```tsx
"use client";

import { useLocale } from "@/shared/i18n/LocaleProvider";
import { FormField } from "@/shared/ui/FormField";
import { useForgotPasswordForm } from "./model/useForgotPasswordForm";

export function ForgotPasswordForm({ onSent }: { onSent: () => void }) {
  const { d } = useLocale();
  const { register, errors, isSubmitting, submitError, onSubmit } = useForgotPasswordForm(onSent);
  const errorText = (key: string | undefined) =>
    key
      ? (d.password.errors[key as keyof typeof d.password.errors] ?? d.password.errors.unknownError)
      : undefined;

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <p className="text-sm text-muted">{d.password.forgot.description}</p>
      <FormField
        label={d.password.forgot.emailLabel}
        type="email"
        registration={register("email")}
        error={errorText(errors.email?.message)}
      />
      {submitError && <p className="text-sm text-sale">{errorText(submitError)}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-foreground py-3 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSubmitting ? d.password.forgot.submitting : d.password.forgot.submit}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: 화면을 만든다**

`src/views/forgot-password/ForgotPasswordView.tsx`:

```tsx
"use client";

import { useState } from "react";
import { MarketLink } from "@/shared/market";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import { ForgotPasswordForm } from "@/features/password";

export function ForgotPasswordView() {
  const { d } = useLocale();
  const [sent, setSent] = useState(false);

  return (
    <div className="mx-auto w-full max-w-480 px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-md">
        <MarketLink
          href="/"
          style={{ fontFamily: "var(--font-noto-jp)" }}
          className="mb-6 block text-center text-2xl font-bold tracking-tight text-foreground"
        >
          {d.brandName}
        </MarketLink>
        <h1 className="mb-6 text-2xl font-bold text-foreground">
          {sent ? d.password.forgot.sentTitle : d.password.forgot.title}
        </h1>
        {sent ? <SentNotice /> : <ForgotPasswordForm onSent={() => setSent(true)} />}
      </div>
    </div>
  );
}

// 가입된 주소든 아니든 같은 화면을 보여준다. 여기서 구분하면 아무나 이메일을
// 넣어보며 회원 목록을 모을 수 있다.
function SentNotice() {
  const { d } = useLocale();
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">{d.password.forgot.sentDescription}</p>
      <MarketLink
        href="/signin"
        className="block w-full border border-border py-3 text-center text-sm font-medium text-foreground hover:bg-sand"
      >
        {d.password.forgot.backToSignin}
      </MarketLink>
    </div>
  );
}
```

- [ ] **Step 4: 라우트를 만든다**

`src/app/[market]/forgot-password/page.tsx`:

```tsx
import { ForgotPasswordView } from "@/views/forgot-password/ForgotPasswordView";

export default function ForgotPasswordPage() {
  return <ForgotPasswordView />;
}
```

- [ ] **Step 5: 슬라이스 공개 API에 추가한다**

`src/features/password/index.ts`:

```ts
export { ChangePasswordCard } from "./ChangePasswordCard";
export { ForgotPasswordForm } from "./ForgotPasswordForm";
```

- [ ] **Step 6: 로그인 화면에 링크를 붙인다**

`src/features/signin-form/SigninForm.tsx`의 `<SignupLink />` 바로 위에 넣는다:

```tsx
      <ForgotPasswordLink />
      <SignupLink />
```

그리고 `SignupLink` 함수 바로 위에 컴포넌트를 추가한다:

```tsx
function ForgotPasswordLink() {
  const { d } = useLocale();
  return (
    <p className="text-center text-xs text-muted">
      <MarketLink
        href="/forgot-password"
        className="underline underline-offset-2 text-foreground"
      >
        {d.signin.forgotPasswordLink}
      </MarketLink>
    </p>
  );
}
```

- [ ] **Step 7: 타입·린트 확인**

Run: `npx tsc --noEmit && npx eslint src`
Expected: tsc 통과, eslint 신규 오류 없음

- [ ] **Step 8: 브라우저에서 확인한다**

`/kr/signin`에서 「비밀번호를 잊으셨나요?」 → `/kr/forgot-password`

1. 가입한 이메일을 넣고 제출 → 「메일을 보냈어요」
2. **가입하지 않은 이메일**을 넣고 제출 → **똑같이** 「메일을 보냈어요」가 떠야 한다. 다르면 계정 열거 통로가 생긴 것이다
3. 메일함에 재설정 메일이 왔는지 확인한다. **아직 링크는 누르지 마라** (Task 7에서 화면을 만든다)
4. 메일 링크의 주소가 `.../kr/auth/reset-password`로 시작하는지 확인한다. `redirectTo`가 Supabase Redirect URLs에 없으면 Site URL로 떨어진다 — 그러면 Task 8의 콘솔 등록을 먼저 하라

- [ ] **Step 9: 커밋**

```bash
git add src/features/password src/views/forgot-password src/app/\[market\]/forgot-password src/features/signin-form/SigninForm.tsx
git commit -m "feat(password): 비밀번호 찾기 화면을 추가한다

- 가입된 주소든 아니든 같은 화면을 보여준다. 여기서 구분하면 아무나 주소를
  넣어보며 이 쇼핑몰 회원 목록을 모을 수 있다. Supabase도 같은 이유로
  존재하지 않는 주소에 에러를 내지 않는다
- redirectTo에 마켓을 붙인다. /jp에서 요청한 사람이 일본어 화면으로 돌아와야 한다"
```

---

## Task 7: 새 비밀번호 설정 화면

메일 링크가 도착하는 화면. **`code` 교환을 직접 하지 마라** — `src/app/[market]/auth/callback/page.tsx`의 주석대로 supabase-js가 `detectSessionInUrl`로 이미 교환하고 일회용 `code_verifier`를 지운다.

**Files:**
- Create: `src/features/password/model/useResetPasswordForm.ts`
- Create: `src/features/password/ResetPasswordForm.tsx`
- Create: `src/views/reset-password/ResetPasswordView.tsx`
- Create: `src/app/[market]/auth/reset-password/page.tsx`
- Modify: `src/features/password/index.ts`

- [ ] **Step 1: 폼 상태 훅을 만든다**

`src/features/password/model/useResetPasswordForm.ts`:

```ts
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPassword } from "@/shared/api/supabase";
import {
  initialResetPasswordFormValues,
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "./schema";

export function useResetPasswordForm(onSuccess: () => void) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: initialResetPasswordFormValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const { error } = await resetPassword(values.password);
    if (error) {
      setSubmitError(error);
      return;
    }
    onSuccess();
  });

  return { register, errors, isSubmitting, submitError, onSubmit };
}
```

- [ ] **Step 2: 폼을 만든다**

`src/features/password/ResetPasswordForm.tsx`:

```tsx
"use client";

import { useLocale } from "@/shared/i18n/LocaleProvider";
import { FormField } from "@/shared/ui/FormField";
import { useResetPasswordForm } from "./model/useResetPasswordForm";

export function ResetPasswordForm({ onSuccess }: { onSuccess: () => void }) {
  const { d } = useLocale();
  const { register, errors, isSubmitting, submitError, onSubmit } =
    useResetPasswordForm(onSuccess);
  const errorText = (key: string | undefined) =>
    key
      ? (d.password.errors[key as keyof typeof d.password.errors] ?? d.password.errors.unknownError)
      : undefined;

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormField
        label={d.password.reset.newLabel}
        type="password"
        registration={register("password")}
        error={errorText(errors.password?.message)}
      />
      <FormField
        label={d.password.reset.confirmLabel}
        type="password"
        registration={register("passwordConfirm")}
        error={errorText(errors.passwordConfirm?.message)}
      />
      {submitError && <p className="text-sm text-sale">{errorText(submitError)}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-foreground py-3 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSubmitting ? d.password.reset.submitting : d.password.reset.submit}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: 화면을 만든다**

`src/views/reset-password/ResetPasswordView.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { MarketLink, useMarketRouter } from "@/shared/market";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import type { Dictionary } from "@/shared/i18n/dictionaries";
import { getIdentityProviders, hasSession } from "@/shared/api/supabase";
import {
  ResetPasswordForm,
  primarySocialProvider,
  providerLabel,
  resolveResetState,
  type ResetState,
} from "@/features/password";

export function ResetPasswordView() {
  const { d } = useLocale();
  const router = useMarketRouter();
  const { state, providers } = useResetTarget();

  return (
    <div className="mx-auto w-full max-w-480 px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-md">
        <MarketLink
          href="/"
          style={{ fontFamily: "var(--font-noto-jp)" }}
          className="mb-6 block text-center text-2xl font-bold tracking-tight text-foreground"
        >
          {d.brandName}
        </MarketLink>
        {state === null && <p className="text-sm text-muted">{d.password.reset.checking}</p>}
        {state === "expired" && <ExpiredNotice />}
        {state === "socialOnly" && <SocialNotice providers={providers} />}
        {state === "ready" && (
          <>
            <h1 className="mb-6 text-2xl font-bold text-foreground">{d.password.reset.title}</h1>
            <ResetPasswordForm onSuccess={() => router.replace("/mypage")} />
          </>
        )}
      </div>
    </div>
  );
}

// supabase-js가 detectSessionInUrl로 URL의 code를 이미 교환했다. 여기서 다시
// 교환하면 일회용 code_verifier가 없어 항상 실패한다 — auth/callback과 같다.
// 교환이 끝나기 전에 읽으면 세션이 없다고 나오므로 SIGNED_IN 이후를 기다린다.
function useResetTarget(): { state: ResetState | null; providers: string[] } {
  const [state, setState] = useState<ResetState | null>(null);
  const [providers, setProviders] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const session = await hasSession();
      const list = session ? await getIdentityProviders() : [];
      if (cancelled) return;
      setProviders(list);
      setState(resolveResetState({ hasSession: session, providers: list }));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { state, providers };
}

function ExpiredNotice() {
  const { d } = useLocale();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{d.password.reset.expiredTitle}</h1>
      <p className="text-sm text-muted">{d.password.reset.expiredDescription}</p>
      <MarketLink
        href="/forgot-password"
        className="block w-full bg-foreground py-3 text-center text-sm font-medium text-white hover:opacity-90"
      >
        {d.password.reset.requestAgain}
      </MarketLink>
    </div>
  );
}

// 여기서는 가입 경로를 밝혀도 된다. 메일 링크를 탔다는 건 그 메일함을 열 수
// 있다는 뜻이라, 이미 본인만 알 수 있는 정보다.
function SocialNotice({ providers }: { providers: string[] }) {
  const { d } = useLocale();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{d.password.reset.socialTitle}</h1>
      <p className="text-sm text-muted">{socialText(d, providers)}</p>
      <MarketLink
        href="/signin"
        className="block w-full bg-foreground py-3 text-center text-sm font-medium text-white hover:opacity-90"
      >
        {d.password.reset.goToSignin}
      </MarketLink>
    </div>
  );
}

function socialText(d: Dictionary, providers: string[]): string {
  const provider = primarySocialProvider(providers);
  return provider
    ? d.password.reset.socialDescription.replaceAll("{provider}", providerLabel(d, provider))
    : d.password.reset.socialDescriptionGeneric;
}
```

- [ ] **Step 4: 슬라이스 공개 API를 마무리한다**

`src/features/password/index.ts`:

```ts
export { ChangePasswordCard } from "./ChangePasswordCard";
export { ForgotPasswordForm } from "./ForgotPasswordForm";
export { ResetPasswordForm } from "./ResetPasswordForm";
export { primarySocialProvider, resolveResetState, type ResetState } from "./model/resetState";
export { providerLabel } from "./model/providerLabel";
```

- [ ] **Step 5: 라우트를 만든다**

`src/app/[market]/auth/reset-password/page.tsx`:

```tsx
import { ResetPasswordView } from "@/views/reset-password/ResetPasswordView";

export default function ResetPasswordPage() {
  return <ResetPasswordView />;
}
```

- [ ] **Step 6: 타입·린트·테스트 확인**

Run: `npx tsc --noEmit && npx eslint src && npx vitest run`
Expected: tsc 통과, eslint 신규 오류 없음, 테스트 전부 통과 (`adminServer.test.ts` 기존 실패 1건 제외)

- [ ] **Step 7: 커밋**

```bash
git add src/features/password src/views/reset-password src/app/\[market\]/auth/reset-password
git commit -m "feat(password): 메일 링크에서 새 비밀번호를 정하게 한다

- code 교환을 직접 하지 않는다. supabase-js가 detectSessionInUrl로 이미
  교환하고 일회용 code_verifier를 지워, 두 번째 교환은 항상 실패한다
- 소셜 계정 판별을 여기서 한다. 링크를 탔다는 건 그 메일함을 열 수 있다는
  뜻이라 가입 경로를 밝혀도 새어나갈 게 없다. 찾기 화면에서 했다면 아무나
  주소를 넣어보며 가입 경로까지 알아낼 수 있었다
- 재설정 후 로그인 상태를 유지한 채 마이페이지로 보낸다. 방금 본인임을
  증명했는데 다시 로그인시킬 이유가 없다"
```

---

## Task 8: 콘솔 설정과 실제 확인

**코드로 못 하는 일이다. 사용자가 Supabase 대시보드에서 직접 해야 한다.**

- [ ] **Step 1: Redirect URLs를 등록한다**

Supabase 대시보드 → Authentication → URL Configuration → Redirect URLs

```
http://localhost:3000/jp/auth/reset-password
http://localhost:3000/kr/auth/reset-password
```

**빠지면 메일 링크가 Site URL로 떨어져 재설정 화면에 도달하지 못한다.** 운영 도메인이 생기면 그 도메인으로도 추가해야 한다.

- [ ] **Step 2: 메일 템플릿을 고친다**

Authentication → Email Templates → **Reset Password**

템플릿은 프로젝트당 하나뿐이라 마켓별로 나눌 수 없다. 일본어와 한국어를 병기한다.

```html
<h2>パスワードの再設定 / 비밀번호 재설정</h2>
<p>下のリンクから新しいパスワードを設定してください。</p>
<p>아래 링크에서 새 비밀번호를 정해주세요.</p>
<p><a href="{{ .ConfirmationURL }}">パスワードを再設定 / 비밀번호 재설정</a></p>
<p>心当たりがない場合はこのメールを破棄してください。 / 요청하지 않으셨다면 이 메일을 무시해주세요.</p>
```

- [ ] **Step 3: `current_password` 강제 옵션을 확인한다**

Authentication → 설정 화면에서 비밀번호 변경 시 현재 비밀번호를 **강제**하는 옵션이 있는지 찾아 켠다. 코드가 항상 `current_password`를 넘기므로 켜지 않아도 동작하지만, 켜두면 클라이언트가 그 값을 빼고 호출하는 것까지 서버가 거절한다. **옵션을 못 찾으면 못 찾았다고 기록하고 넘어가라. 없는 걸 있다고 지어내지 마라.**

- [ ] **Step 4: 재설정을 끝까지 태운다**

실제 메일을 기다리지 않고 복구 링크를 직접 만든다.

```bash
cat > /tmp/recovery-link.mjs <<'EOF'
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")]),
);
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const { data, error } = await admin.auth.admin.generateLink({
  type: "recovery",
  email: process.argv[2],
  options: { redirectTo: "http://localhost:3000/kr/auth/reset-password" },
});
console.log(error ?? data.properties.action_link);
EOF
cp /tmp/recovery-link.mjs ./recovery-link.mjs   # pnpm 워크스페이스라 리포 안에서 실행해야 모듈이 잡힌다
node ./recovery-link.mjs <이메일계정>
rm ./recovery-link.mjs
```

나온 링크를 브라우저에 붙여 넣고 확인할 것

1. 새 비밀번호 두 칸이 보인다
2. 8자 미만 → 「비밀번호는 8자 이상으로 입력해주세요」
3. 두 칸을 다르게 → 「비밀번호가 일치하지 않아요」
4. 정상 입력 → 마이페이지로 이동하고 **로그인 상태가 유지된다**
5. 로그아웃 후 **새 비밀번호로 로그인된다**

- [ ] **Step 5: 만료 갈래를 확인한다**

같은 링크를 **한 번 더** 열면 세션이 만들어지지 않는다 → 「링크가 만료됐어요」와 「다시 요청하기」가 보여야 한다.

- [ ] **Step 6: 소셜 계정 갈래를 확인한다**

카카오로 가입한 테스트 계정에 대해 Step 4의 스크립트로 링크를 만들어 연다.

「비밀번호가 없는 계정이에요 / 카카오로 가입한 계정이에요」와 「로그인 화면으로」가 보여야 하고, **비밀번호 입력란이 없어야 한다.**

마이페이지도 같은 계정으로 열어 **비밀번호 카드에 입력란 대신 안내만** 보이는지 확인한다.

- [ ] **Step 7: 회귀를 확인한다**

- 기존 이메일 로그인·회원가입이 그대로 동작한다
- 마이페이지 프로필 수정이 그대로 동작한다
- `/jp/forgot-password`가 일본어로 보이고, 거기서 만든 링크가 `/jp/auth/reset-password`로 돌아온다

- [ ] **Step 8: 테스트 계정을 지운다**

확인에 쓴 계정을 Supabase 대시보드 → Authentication → Users에서 삭제한다. **이 단계를 건너뛰지 마라.**

---

## Task 9: 문서

**Files:**
- Modify: `docs/specs/2026-09-01-password-management-design.md`
- Modify: `docs/multi-market-status.md`

- [ ] **Step 1: 설계서의 파일명을 실제와 맞춘다**

설계서 「파일 구조」의 `ChangePasswordForm.tsx  마이페이지 카드 안` 줄을 다음으로 바꾼다.

```
  ChangePasswordCard.tsx          마이페이지 카드 (조회중·소셜안내·접힘·펼침)
```

그리고 같은 목록에 두 줄을 추가한다.

```
  model/useIdentityProviders.ts   가입 경로 조회
  model/providerLabel.ts          provider 이름을 사전 문구로
```

- [ ] **Step 2: 실제로 확인된 에러 코드를 반영한다**

설계서의 "현재 비밀번호 불일치 시 GoTrue가 내는 코드는 **구현할 때 실제 응답으로 확인한다**" 문단을, Task 5 Step 8에서 확인한 실제 코드로 바꾼다. 예를 들어 `invalid_credentials`였다면

```
현재 비밀번호가 틀리면 GoTrue는 `invalid_credentials`를 낸다 (2026-09-01 실제 응답으로 확인).
```

- [ ] **Step 3: 설계서의 i18n 절을 실제와 맞춘다**

설계서는 `passwordChange` · `forgotPassword` · `resetPassword` 세 블록으로 적었지만 실제로는
`password` 블록 하나에 `change` · `forgot` · `reset` 하위와 공용 `errors`를 뒀다. 세 화면이 같은
오류 문구를 쓰기 때문이다. 설계서의 「문구 (i18n)」 절 첫 문단을 이렇게 바꾼다.

```
`dictionaries.ts`에 `password` 블록 하나를 추가한다 (ja · ko 양쪽). 안에 화면별 하위
(`change` · `forgot` · `reset`)와 **공용 `errors`**를 둔다. 세 화면이 「필수」·「8자 이상」·
「일치하지 않음」을 똑같이 쓰므로 화면별로 블록을 나누면 오류 문구가 세 벌이 된다.
```

- [ ] **Step 4: 진행표에 항목을 추가한다**

`docs/multi-market-status.md`의 「한눈에」 표 아래, 「지금 동작하는 것」 절에 한 줄 추가한다.

```
- 비밀번호 변경(마이페이지) · 재설정(메일 링크) — 이메일 가입 계정만. 소셜 계정은 각 서비스에서 관리
```

- [ ] **Step 5: 커밋**

```bash
git add docs
git commit -m "docs: 비밀번호 기능 구현 결과를 반영한다

- 설계서의 파일명을 실제 구현과 맞췄다. 카드가 네 상태를 가져서 Form이 아니라
  Card가 됐다
- 추측으로 남겨뒀던 에러 코드를 실제 응답으로 확인해 채웠다"
```

---

## 마무리

- [ ] `npx tsc --noEmit` 통과
- [ ] `npx vitest run` — 신규 18개 포함 전부 통과 (`adminServer.test.ts` 기존 실패 1건 제외)
- [ ] `npx eslint src` — 신규 오류 없음 (`FontModeProvider.tsx` 기존 오류 1건만)
- [ ] `pnpm build` 통과
- [ ] `git status` 깨끗함 (Task 8의 `recovery-link.mjs`를 지웠는지 확인)
- [ ] 테스트 계정 삭제됨

`superpowers:finishing-a-development-branch`로 마무리한다.
