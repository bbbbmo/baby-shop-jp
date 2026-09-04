"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

// 실제 PG 결제창을 대신하는 화면. 계약 전에도 결제 전 구간을 돌려보고,
// 계약 후에도 e2e 회귀에 쓴다. 운영에서는 page.tsx가 404로 막는다.
type Outcome = { result: string; amount?: string; label: string };

const OUTCOMES: Outcome[] = [
  { result: "approved", label: "승인" },
  { result: "approved", amount: "1", label: "금액 불일치 승인" },
  { result: "cancelled", label: "결제 취소" },
  { result: "failed", label: "결제 실패" },
];

function MockPayContent() {
  const params = useSearchParams();
  const returnUrl = params.get("returnUrl") ?? "";
  const cancelUrl = params.get("cancelUrl") ?? "";
  const amount = params.get("amount") ?? "";
  const orderNumber = params.get("orderNumber") ?? "";

  return (
    <div className="mx-auto max-w-480 px-6 py-16 sm:px-10">
      <h1 className="text-xl font-bold text-foreground">테스트 결제창</h1>
      <p className="mt-2 text-sm text-muted">
        주문번호 {orderNumber} · 결제금액 {amount}
      </p>
      <div className="mt-8 space-y-3">
        {OUTCOMES.map((outcome) => (
          <OutcomeButton key={outcome.label} outcome={outcome} returnUrl={returnUrl} />
        ))}
        <a
          href={cancelUrl || "/"}
          className="block w-full border border-border py-3 text-center text-sm text-foreground"
        >
          결제창 닫기
        </a>
      </div>
    </div>
  );
}

function OutcomeButton({ outcome, returnUrl }: { outcome: Outcome; returnUrl: string }) {
  return (
    <a
      href={buildReturnHref(returnUrl, outcome)}
      className="block w-full bg-foreground py-3 text-center text-sm text-white hover:opacity-90"
    >
      {outcome.label}
    </a>
  );
}

function buildReturnHref(returnUrl: string, outcome: Outcome): string {
  if (!returnUrl) {
    return "/";
  }
  const url = new URL(returnUrl);
  url.searchParams.set("mockResult", outcome.result);
  if (outcome.amount) {
    url.searchParams.set("mockAmount", outcome.amount);
  }
  return url.toString();
}

export function MockPayView() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-480 px-6 py-16 sm:px-10" />}>
      <MockPayContent />
    </Suspense>
  );
}
