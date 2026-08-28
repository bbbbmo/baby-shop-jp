"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import { useSession } from "@/entities/auth";
import { ConsentForm } from "@/features/consent-form";
import { LocaleToggle } from "@/features/locale-toggle";

export function ConsentView() {
  const { d } = useLocale();
  const router = useRouter();
  const { user, loading } = useSession();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/signin");
    }
  }, [loading, user, router]);

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-480 px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-md">
        <Link
          href="/"
          style={{ fontFamily: "var(--font-noto-jp)" }}
          className="mb-6 block text-center text-2xl font-bold tracking-tight text-foreground"
        >
          {d.brandName}
        </Link>
        <div className="mb-6 w-32">
          <LocaleToggle />
        </div>
        <h1 className="mb-6 text-2xl font-bold text-foreground">{d.consent.title}</h1>
        <ConsentForm userId={user.id} onSuccess={() => router.replace("/")} />
      </div>
    </div>
  );
}
