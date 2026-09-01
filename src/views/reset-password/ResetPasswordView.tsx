"use client";

import { useEffect, useState } from "react";
import { MarketLink, useMarketRouter } from "@/shared/market";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import type { Dictionary } from "@/shared/i18n/dictionaries";
import {
  getIdentityProviders,
  hasSession,
  restoreSessionFromUrlHash,
} from "@/shared/api/supabase";
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
        {state === "unknown" && <UnknownNotice />}
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
function useResetTarget(): { state: ResetState | null; providers: string[] | null } {
  const [state, setState] = useState<ResetState | null>(null);
  const [providers, setProviders] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // 해시 방식 링크(관리자·대시보드 발행)는 supabase-js가 처리하지 않으므로
      // 먼저 세워준다. "?code=" 링크면 아무 일도 하지 않고 지나간다.
      await restoreSessionFromUrlHash();
      const session = await hasSession();
      const list = session ? await getIdentityProviders() : null;
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

// 가입 경로를 확인하지 못한 경우다. 소셜 계정이라고 단정하면 이메일 가입자에게
// 거짓말이 된다. 세션은 살아 있으므로 새로고침이 실제로 통한다.
function UnknownNotice() {
  const { d } = useLocale();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{d.password.reset.unknownTitle}</h1>
      <p className="text-sm text-muted">{d.password.reset.unknownDescription}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="block w-full bg-foreground py-3 text-center text-sm font-medium text-white hover:opacity-90"
      >
        {d.password.reset.retry}
      </button>
    </div>
  );
}

// 여기서는 가입 경로를 밝혀도 된다. 메일 링크를 탔다는 건 그 메일함을 열 수
// 있다는 뜻이라, 이미 본인만 알 수 있는 정보다.
function SocialNotice({ providers }: { providers: string[] | null }) {
  const { d } = useLocale();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{d.password.reset.socialTitle}</h1>
      <p className="text-sm text-muted">{socialText(d, providers ?? [])}</p>
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
