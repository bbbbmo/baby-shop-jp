"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";
import { hasSession, hasConsentRecord } from "@/shared/api/supabase";
import { resolvePostAuthDestination } from "@/entities/auth";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <AuthCallbackHandler />
    </Suspense>
  );
}

function AuthCallbackHandler() {
  const searchParams = useSearchParams();
  const handled = useRef(false);

  useEffect(() => {
    // React StrictMode(dev)가 effect를 두 번 실행하는데, OAuth code는
    // 한 번 쓰면 무효화되는 일회용 값이라 두 번째 exchange는 항상 실패한다.
    // ref로 막아 실제 처리가 한 번만 일어나게 한다.
    if (handled.current) return;
    handled.current = true;
    handleCallback(searchParams);
  }, [searchParams]);

  return <div className="mx-auto max-w-480 px-6 py-20 sm:px-10" />;
}

async function handleCallback(searchParams: ReadonlyURLSearchParams): Promise<void> {
  const from = searchParams.get("from") === "signin" ? "signin" : "signup";
  const oauthError = searchParams.get("error");
  const hasCode = searchParams.get("code") !== null;
  // 여기서 code를 직접 교환하면 안 된다. supabase-js가 detectSessionInUrl로
  // 이 화면에서 이미 교환을 끝내고 일회용 code_verifier를 삭제하기 때문에,
  // 두 번째 교환은 항상 pkce_code_verifier_not_found로 실패한다.
  const session = oauthError || !hasCode ? false : await hasSession();
  const consent = session ? await readConsent() : false;
  window.location.replace(
    resolvePostAuthDestination({ from, oauthError, hasCode, hasSession: session, hasConsent: consent }),
  );
}

// 조회에 실패했다고 로그인을 막을 수는 없다. 동의 화면을 한 번 더 보여주는
// 쪽이 사용자를 로그인 화면으로 되돌리는 것보다 낫다.
async function readConsent(): Promise<boolean> {
  try {
    return await hasConsentRecord();
  } catch {
    return false;
  }
}
