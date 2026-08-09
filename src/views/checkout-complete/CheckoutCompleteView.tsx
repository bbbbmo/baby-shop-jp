"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import { useSession } from "@/entities/auth";
import { useCart } from "@/entities/cart";

function CheckoutCompleteContent() {
  const { d } = useLocale();
  const { user } = useSession();
  const params = useSearchParams();
  const orderNumber = params.get("order") ?? "";
  const clear = useCart((s) => s.clear);

  useEffect(() => {
    clear();
  }, [clear]);

  return (
    <div className="mx-auto max-w-480 px-6 py-16 text-center sm:px-10">
      <h1 className="text-2xl font-bold text-foreground">{d.checkoutComplete.title}</h1>
      <p className="mt-4 text-sm text-muted">{d.checkoutComplete.orderNumberLabel}</p>
      <p className="text-lg font-bold text-foreground">{orderNumber}</p>
      <p className="mt-6 text-sm text-muted">
        {user ? d.checkoutComplete.memberNotice : d.checkoutComplete.guestNotice}
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-full bg-foreground px-6 py-2.5 text-sm text-white hover:opacity-90"
      >
        {d.checkoutComplete.backToHome}
      </Link>
    </div>
  );
}

export function CheckoutCompleteView() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-480 px-6 py-16 sm:px-10" />}>
      <CheckoutCompleteContent />
    </Suspense>
  );
}
