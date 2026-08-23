"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";
import { exchangeCodeForSession } from "@/shared/api/supabase";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <AuthCallbackHandler />
    </Suspense>
  );
}

function AuthCallbackHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
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
  const { error } = await exchangeCodeForSession(code);
  window.location.replace(error ? `/${from}?authError=${error}` : "/");
}
