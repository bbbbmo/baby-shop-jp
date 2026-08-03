"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";
import { exchangeCodeForSession } from "@/shared/api/supabase";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <AuthCallbackHandler />
    </Suspense>
  );
}

function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    handleCallback(searchParams, router);
  }, [searchParams, router]);

  return <div className="mx-auto max-w-480 px-6 py-20 sm:px-10" />;
}

async function handleCallback(
  searchParams: ReadonlyURLSearchParams,
  router: ReturnType<typeof useRouter>,
): Promise<void> {
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  if (oauthError || !code) {
    router.replace(`/signup?authError=${oauthError ?? "oauthCancelled"}`);
    return;
  }
  const { error } = await exchangeCodeForSession(code);
  router.replace(error ? `/signup?authError=${error}` : "/");
}
