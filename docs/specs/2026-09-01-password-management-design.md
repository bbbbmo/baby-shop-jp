# 비밀번호 변경 · 재설정 설계

작성일: 2026-09-01

## 목표

이메일로 가입한 회원이 두 가지를 할 수 있게 한다.

- **비밀번호 변경** — 로그인한 상태에서 마이페이지에서 바꾼다
- **비밀번호 재설정** — 비밀번호를 잊었을 때 메일 링크로 새로 정한다

지금은 둘 다 없다. 비밀번호를 잊으면 계정을 되찾을 방법이 없다.

## 범위 밖

**이메일 변경.** 확인 메일이 옛 주소와 새 주소 양쪽으로 가는 별개 흐름이라 같이 묶으면 커진다.

---

## 소셜 로그인 계정을 어떻게 다루는가

카카오·구글·라인으로 가입한 계정에는 비밀번호가 없다. 그쪽 비밀번호는 그쪽이 관리할 일이므로
**우리 재설정 흐름은 이메일+비밀번호 계정만 다룬다.**

그런데 이건 가만히 두면 안 되는 일이다. Supabase 기본 동작은

- 가입 안 된 이메일 → 메일을 보내지 않지만 **에러도 내지 않는다** (계정 열거 방지가 이미 들어 있다)
- 소셜 전용 계정 → **메일이 나가고 비밀번호가 생긴다.** 그런데 `identities`에는 `email`이 추가되지
  않아, 어디에도 잡히지 않는 비밀번호가 남는다
  ([supabase/discussions#37737](https://github.com/orgs/supabase/discussions/37737)의 "ghost password")

### 판별 방법

`User.identities`에 `provider === "email"`인 항목이 있는지 본다. 클라이언트에서 읽을 수 있으므로
**서비스롤 키를 쓰는 서버 라우트가 필요 없다.**

세션 안의 user 객체가 `identities`를 항상 담고 있다고 보장할 수 없으므로 `supabase.auth.getUser()`로
조회한다. 이 호출은 서버에 물어보고 전체 user를 돌려준다.

### 판별 시점 — 메일 링크를 탄 뒤

「비밀번호 찾기」 입력 화면은 로그인 전이라 **누구나 아무 이메일이나 넣어볼 수 있다.** 여기서
「카카오로 가입한 계정입니다」를 보여주면 가입 여부와 가입 경로가 외부로 새어나간다. 누구든 주소를
넣어보며 이 쇼핑몰 회원 목록과 가입 경로를 모을 수 있고, 그건 「카카오 계정에 문제가 있습니다」 같은
피싱 메일의 표적 명단이 된다. Supabase가 일부러 피하고 있는 걸 우리가 되살릴 이유가 없다.

그래서 판별을 **메일 링크를 탄 뒤로 미룬다.** 그 시점에는 이미 메일함 소유를 증명했으므로 계정
존재를 알려줘도 새어나갈 것이 없다.

| 화면 | 묻는 사람 | 소셜 여부를 알려주는가 |
| --- | --- | --- |
| 마이페이지 비밀번호 변경 | 로그인된 본인 | 알려준다 |
| 비밀번호 찾기 입력 | 아무나 | **알려주지 않는다** |
| 재설정 링크를 탄 화면 | 메일함 소유 증명됨 | 알려준다 |

---

## 화면

| 경로 | 화면 | 접근 조건 |
| --- | --- | --- |
| `/[market]/mypage` 안의 카드 | 비밀번호 변경 | 로그인 + email 계정일 때만 |
| `/[market]/forgot-password` | 비밀번호 찾기 (메일 요청) | 누구나 |
| `/[market]/auth/reset-password` | 새 비밀번호 설정 | 복구 링크로 들어온 세션 |

재설정 화면을 `auth/` 밑에 두는 이유는 `auth/callback` · `auth/consent`와 같은 성격이기 때문이다.
셋 다 메일이나 외부 서비스에서 돌아오는 착지점이다.

`/signin`에 「비밀번호를 잊으셨나요?」 링크를 넣어 `/forgot-password`로 보낸다.

---

## 흐름

### A. 비밀번호 변경 (로그인 상태)

1. 마이페이지가 `getIdentityProviders()`로 가입 경로를 조회한다
2. `email`이 없으면 카드 대신 「카카오로 로그인 중입니다」를 보여준다 (입력란 없음)
3. `email`이 있으면 접힌 카드에 「비밀번호 변경」 버튼만 보여준다. 누르면 **현재 비밀번호 /
   새 비밀번호 / 새 비밀번호 확인** 세 칸이 펼쳐진다 — 바로 위 `ProfileCard`의 「정보 수정」과
   같은 방식이라 화면이 일관된다
4. `updateUser({ current_password, password })`
5. 성공 → 카드를 다시 접고 「변경했습니다」. **다른 기기 세션은 유지한다**

현재 비밀번호를 받는 이유는 카페에서 자리를 비운 사이에 남이 계정을 통째로 가져가는 걸 막기
위해서다. `updateUser`에 `current_password`를 넘기면 **서버가 검증한다**(공식 문서 "Verifying the
current password"). 클라이언트에서 `signInWithPassword`로 확인하는 방식은 개발자도구로 우회할 수
있고 로그인 시도 기록도 지저분해져서 쓰지 않는다.

### B. 비밀번호 재설정

1. `/forgot-password`에서 이메일을 입력한다
2. `resetPasswordForEmail(email, { redirectTo })`. `redirectTo`는 절대 주소여야 하므로
   화면에서 `` `${window.location.origin}${marketPath(market, "/auth/reset-password")}` ``로
   만들어 넘긴다. 마켓을 붙여야 `/jp`에서 요청한 사람이 일본어 화면으로 돌아온다
3. **결과와 무관하게** 「메일을 보냈습니다」를 보여준다 (계정 열거 방지)
4. 메일 링크를 누르면 `/auth/reset-password`에 도착한다. supabase-js의 `detectSessionInUrl`이
   URL의 `code`를 교환해 복구 세션을 만든다 — `auth/callback`과 같은 구조다.
   **여기서 코드를 직접 교환하면 안 된다.** 일회용 `code_verifier`가 이미 지워져 실패한다
5. 화면이 네 갈래로 갈린다

| 상태 | 화면 |
| --- | --- |
| 세션 없음 | 「링크가 만료됐습니다」 + 「다시 요청하기」 링크 |
| **가입 경로 조회 실패** | 「확인하지 못했어요」 + 「다시 시도」. **소셜 계정과 구분해야 한다** — 이메일 가입자에게 소셜 계정이라고 말하면 거짓이고, 복구 링크는 일회용이라 그 사람은 그대로 막힌다 |
| `email` identity 없음 | 「카카오로 가입한 계정입니다」 + 해당 소셜 로그인 버튼 |
| 정상 | 새 비밀번호 / 확인 → `updateUser({ password })` → `signOut({ scope: "others" })` → 마이페이지 |

복구 링크로 들어온 세션은 **로그인된 세션이다.** 비밀번호를 새로 정하고 나면 그대로 로그인 상태를
유지한 채 마이페이지로 보낸다. 방금 본인임을 증명했는데 다시 로그인시킬 이유가 없다.

재설정에서만 다른 기기를 끊는 이유는, 비밀번호를 잊어 재설정하는 상황은 계정을 빼앗겼을 가능성이
있기 때문이다. 마이페이지에서 자발적으로 바꾸는 건 본인이 이미 로그인해 있는 상황이라 끊지 않는다.
휴대폰이 이유 없이 로그아웃되는 짜증을 주지 않는다.

`signOut({ scope: "others" })`는 이 기기의 세션은 남기고 나머지를 끊는다. 다만 **이미 발급된 access
token은 만료 전까지 살아 있다** — 끊기는 건 refresh token이다. 완전한 즉시 차단은 Supabase가
제공하지 않는다.

---

## 파일 구조

세 화면이 「새 비밀번호 + 확인」이라는 같은 규칙을 공유한다. 슬라이스를 셋으로 나누면 zod 스키마가
세 벌로 복제되므로 **`features/password` 한 슬라이스에 폼 셋을 둔다.**

```
src/features/password/
  index.ts
  ChangePasswordCard.tsx          마이페이지 카드 (조회중·소셜안내·접힘·펼침)
  ForgotPasswordForm.tsx          메일 요청
  ResetPasswordForm.tsx           새 비밀번호 설정
  model/schema.ts                 비밀번호 규칙 (한 곳)
  model/schema.test.ts
  model/resetState.ts             재설정 화면 네 갈래 판단 (순수 함수)
  model/resetState.test.ts
  model/useIdentityProviders.ts   가입 경로 조회
  model/providerLabel.ts          provider 이름을 사전 문구로
  model/useChangePasswordForm.ts
  model/useForgotPasswordForm.ts
  model/useResetPasswordForm.ts

src/views/forgot-password/ForgotPasswordView.tsx
src/views/reset-password/ResetPasswordView.tsx

src/app/[market]/forgot-password/page.tsx
src/app/[market]/auth/reset-password/page.tsx
```

수정하는 기존 파일

| 파일 | 무엇을 |
| --- | --- |
| `src/shared/api/supabase/auth.ts` | 함수 5개 추가 + `mapAuthError`를 표로 |
| `src/shared/api/supabase/index.ts` | 위 함수 공개 |
| `src/views/mypage/MypageView.tsx` | `ProfileCard` 아래에 비밀번호 카드 배치 |
| `src/features/signin-form/SigninForm.tsx` | 「비밀번호를 잊으셨나요?」 링크 |
| `src/shared/i18n/dictionaries.ts` | `password` 블록 하나 (ja · ko) |

---

## shared/api/supabase/auth.ts에 추가할 함수

상위 레이어가 `supabase-js`를 직접 보지 않도록 도메인 함수만 노출한다 (CLAUDE.md 규칙).

```ts
export async function changePassword(params: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ error: string | null }>;

export async function requestPasswordReset(
  email: string,
  redirectTo: string,
): Promise<{ error: string | null }>;

// 비밀번호를 바꾸고 다른 기기의 세션을 끊는다.
export async function resetPassword(
  newPassword: string,
): Promise<{ error: string | null }>;

// 가입 경로 목록 ("email" · "kakao" · "google" · "line").
// 세션의 user 객체가 identities를 담는다는 보장이 없어 getUser()로 조회한다.
// 조회 실패는 null — 빈 배열로 뭉개면 "비밀번호 없는 계정"과 구분되지 않아
// 이메일 가입자에게 소셜 계정이라고 잘못 안내하게 된다.
export async function getIdentityProviders(): Promise<string[] | null>;

// 해시 방식(#access_token=...) 복구 링크를 세션으로 세운다. 아래 "구현하며
// 알게 된 것" 참고.
export async function restoreSessionFromUrlHash(): Promise<boolean>;
```

에러는 기존 `mapAuthError`를 통과시켜 문자열 코드로 돌린다. 다음 코드를 추가한다.

- `same_password` → 기존과 같은 비밀번호
- `current_password_invalid` → 현재 비밀번호 불일치. **실제 응답으로 확인했다(2026-09-01).**
  `invalid_credentials`로 예상했는데 아니었다. 추측대로 뒀다면 「오류가 발생했어요」가 떠서
  사용자가 무엇이 틀렸는지 알 수 없었다
- `current_password_required` → 서버가 요구하는데 값이 빠진 경우. 폼은 항상 함께 보내므로
  여기까지 오지 않지만 같은 문구로 안내한다

---

## 순수 함수

### `model/schema.ts`

```ts
// 회원가입과 같은 규칙이어야 한다. 가입 때 8자를 통과한 비밀번호가
// 변경 화면에서 거부되면 사용자가 이유를 알 수 없다.
const newPasswordFields = {
  password: z.string().min(8, "passwordTooShort"),
  passwordConfirm: z.string().min(1, "required"),
};

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "required").email("invalidEmail"),
});

export const resetPasswordSchema = z.object(newPasswordFields).refine(
  (v) => v.password === v.passwordConfirm,
  { message: "passwordMismatch", path: ["passwordConfirm"] },
);

export const changePasswordSchema = z
  .object({ currentPassword: z.string().min(1, "required"), ...newPasswordFields })
  .refine((v) => v.password === v.passwordConfirm, {
    message: "passwordMismatch",
    path: ["passwordConfirm"],
  })
  // 같은 값이면 Supabase가 same_password로 거절한다. 왕복하기 전에 잡는다.
  .refine((v) => v.currentPassword !== v.password, {
    message: "samePassword",
    path: ["password"],
  });
```

`passwordTooShort` · `passwordMismatch` · `invalidEmail` · `required`는 회원가입 스키마가 이미 쓰는
코드다. 같은 이름을 쓴다.

### `model/resetState.ts`

`entities/auth/postAuthDestination.ts`와 같은 모양의 순수 판단 함수다. 화면 분기를 렌더링에서
떼어내야 테스트할 수 있다.

```ts
export type ResetState = "expired" | "unknown" | "socialOnly" | "ready";

export function resolveResetState(input: {
  hasSession: boolean;
  providers: string[] | null;
}): ResetState {
  if (!input.hasSession) return "expired";
  // 조회 실패(null)와 "가입 경로가 없음"(빈 배열)은 다르다.
  if (input.providers === null) return "unknown";
  if (!input.providers.includes("email")) return "socialOnly";
  return "ready";
}

// "socialOnly"일 때 어떤 소셜을 안내할지 고른다. 여러 개면 첫 번째를 쓴다.
export function primarySocialProvider(providers: string[]): string | null;
```

---

## 문구 (i18n)

`dictionaries.ts`에 `password` 블록 **하나**를 추가한다 (ja · ko 양쪽). 안에 화면별 하위
(`change` · `forgot` · `reset`)와 **공용 `errors`**를 둔다. 세 화면이 「필수」·「8자 이상」·
「일치하지 않음」을 똑같이 쓰므로 화면별로 블록을 나누면 오류 문구가 세 벌이 된다.

소셜 안내 문구는 `{provider}` 자리표시자를 쓴다. 카카오·구글·라인마다 문장을 복제하면
문구를 고칠 때 하나를 빠뜨린다.

메일 본문은 Supabase 템플릿이 **프로젝트당 하나**라 마켓별로 나눌 수 없다. 일본어와 한국어를
병기한다.

---

## 콘솔 작업 (코드로 못 하는 것)

1. **Authentication → URL Configuration → Redirect URLs에 두 줄 추가**

   ```
   http://localhost:3000/jp/auth/reset-password
   http://localhost:3000/kr/auth/reset-password
   ```

   빠지면 메일 링크가 죽는다. 운영 도메인이 생기면 그 도메인으로도 추가해야 한다.

2. **메일 템플릿(Reset Password)** 일본어·한국어 병기로 수정

3. **Authentication → Sign In / Providers → Email → 「Require current password when updating」을
   반드시 켠다.** 선택이 아니라 필수다. 꺼져 있으면 GoTrue가 `current_password`를 **조용히
   무시해서** 틀린 현재 비밀번호로도 변경이 성공한다. 원시 HTTP로 필드를 아예 빼고 보내도 200이
   떨어지는 것을 확인했다. 켜기 전 상태는 현재 비밀번호를 묻기만 하고 검증하지 않는 보안 연극이다.

   바로 위에 있는 「Secure password change」는 **다른 항목이다.** 그건 "최근 24시간 내
   로그인했으면 재인증 없이 통과"를 정하는 것이라 여기서 필요한 게 아니다.

4. **Minimum password length를 8로 맞춘다.** 기본값 6이면 화면(8자)을 우회했을 때 6자가 들어간다.

5. 유출 비밀번호 검사(`Prevent use of leaked passwords`)는 Pro 플랜 이상이다. 무료 플랜에서는
   `password` 같은 흔한 값이 통과한다. 유료 전환 시 켠다 — HaveIBeenPwned를 직접 붙이지 말 것.

---

## 검증

### 단위 테스트

- `schema.test.ts` — 8자 미만 거부, 확인란 불일치, 현재와 같은 비밀번호 거부, 이메일 형식
- `resetState.test.ts` — 네 갈래 각각, 조회 실패(`null`)와 빈 배열의 구분, 구글·라인 계정,
  email과 kakao를 둘 다 가진 계정

### 브라우저 확인

**비밀번호 변경**은 그대로 태울 수 있다. 로그인 → 마이페이지 → 현재 비밀번호를 틀리게 넣어 거부를
확인하고, 맞게 넣어 변경한 뒤 새 비밀번호로 다시 로그인한다.

**재설정**은 실제 메일이 필요해 까다롭다. 서비스롤 키로
`supabase.auth.admin.generateLink({ type: "recovery", email })`을 호출하면 **메일 없이 복구 링크를
직접 만들 수 있다.** 그 링크로 브라우저를 태워 끝까지 확인한다.

소셜 전용 계정 갈래는 카카오로 가입한 테스트 계정을 만들어 같은 방법으로 링크를 뽑아 확인한다.

**확인에 쓴 테스트 계정은 끝나고 지운다.**

### 회귀

- 기존 로그인·회원가입이 그대로 동작하는지
- 마이페이지 프로필 수정이 그대로 동작하는지
- 소셜 로그인 계정으로 마이페이지에 들어가면 비밀번호 카드가 **안 보이는지**

---

## 구현하며 알게 된 것

설계 시점에 몰랐다가 실제로 돌려보고 드러난 것들이다. 다시 건드릴 때 같은 데서 막히지 않도록 남긴다.

### 복구 링크는 두 형식으로 온다

화면에서 요청한 메일은 PKCE라 `?code=`로 오고 supabase-js가 알아서 교환한다. 그런데 **관리자
API(`admin.generateLink`)와 Supabase 대시보드가 발행하는 링크는 `#access_token=...`**(암시적 방식)
이다. 우리 클라이언트는 `createBrowserClient`(PKCE + 쿠키)라 후자를 그냥 흘려버려, 멀쩡한 링크가
「링크가 만료됐어요」로 보였다.

`restoreSessionFromUrlHash()`가 해시에 토큰이 있으면 `setSession`으로 직접 세운다. 세운 뒤
주소창의 토큰은 지운다 — 남겨두면 공유·기록으로 새 나간다.

### 「비밀번호 찾기」는 에러에서 분기하면 안 된다

Supabase는 가입되지 않은 주소에는 발송을 시도조차 하지 않아 에러가 나지 않는다. 반대로 가입된
주소에서만 발송 실패(도메인 무효, 발송 한도 초과)가 난다. **즉 「에러가 났다」가 곧 「이 주소는
가입돼 있다」는 신호다.**

처음 구현은 에러를 화면에 띄웠고, 실제로 확인해 보니 가입된 주소만 폼에 머물고 없는 주소는
「메일을 보냈어요」로 넘어갔다. 계정 열거를 막으려던 화면이 정확히 그걸 하고 있었다.
지금은 결과를 보지 않고 항상 같은 화면을 보여준다.

### 검증에 쓴 방법

실제 메일을 기다리지 않고 `admin.generateLink({ type: "recovery" })`로 복구 링크를 직접 만들어
브라우저로 태웠다. 링크 진입 → 새 비밀번호 설정 → 마이페이지 로그인 유지 → 같은 링크 재사용 시
만료 → 새 비밀번호로 로그인까지 확인했다.

무료 플랜의 기본 SMTP는 발송 한도가 빡빡해 실제 메일 수신으로는 확인이 어렵다.
