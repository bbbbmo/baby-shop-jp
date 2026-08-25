"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";
import { hasSession } from "@/shared/api/supabase";

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
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  if (oauthError || !code) {
    window.location.replace(`/${from}?authError=${oauthError ?? "oauthCancelled"}`);
    return;
  }
  // 여기서 code를 직접 교환하면 안 된다. supabase-js가 detectSessionInUrl로
  // 이 화면에서 이미 교환을 끝내고 일회용 code_verifier를 삭제하기 때문에,
  // 두 번째 교환은 항상 pkce_code_verifier_not_found로 실패한다.
  // 그 실패가 로그인 성공을 에러 화면으로 덮어쓰던 것이 원래 버그였다.
  window.location.replace((await hasSession()) ? "/" : `/${from}?authError=unknownError`);
}
