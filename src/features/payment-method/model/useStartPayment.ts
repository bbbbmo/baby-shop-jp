"use client";

import { useState } from "react";
import type { NextAction, PaymentOutcomeCode } from "@/shared/api/payments/types";

type StartResponse = { paymentId: string; nextAction: NextAction } | { error: string };

// 라우트가 돌려주는 오류 이름을 화면이 아는 코드로 옮긴다. 서버의 오류 이름을
// 그대로 사전 키로 쓰면 둘 중 하나만 바뀌어도 조용히 「알 수 없는 오류」가 된다.
const START_ERRORS: Record<string, PaymentOutcomeCode> = {
  alreadyPaid: "alreadyPaid",
  providerDown: "providerDown",
  orderNotFound: "notFound",
};

export function useStartPayment() {
  const [payError, setPayError] = useState<string | null>(null);

  const start = async (orderNumber: string, email: string, methodId: string): Promise<void> => {
    setPayError(null);
    // 지난 실패가 남긴 ?payError=를 지운다. 두지 않으면 이번 시도가 잘 돼도
    // 화면에는 옛 오류가 그대로 떠 있어 「또 실패했다」로 읽힌다.
    clearPayErrorParam();
    try {
      const result = await requestStart(orderNumber, email, methodId);
      if ("error" in result) {
        setPayError(START_ERRORS[result.error] ?? "unknown");
        return;
      }
      performNextAction(result.nextAction);
    } catch {
      setPayError("unknown");
    }
  };

  return { start, payError };
}

async function requestStart(
  orderNumber: string,
  email: string,
  methodId: string,
): Promise<StartResponse> {
  const res = await fetch("/api/payments/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderNumber, email, methodId }),
  });
  return (await res.json()) as StartResponse;
}

function clearPayErrorParam(): void {
  const url = new URL(window.location.href);
  if (url.searchParams.has("payError")) {
    url.searchParams.delete("payError");
    window.history.replaceState(null, "", url.toString());
  }
}

// 결제창을 여는 방법은 PG마다 다르다. 지금은 리다이렉트 하나뿐이고,
// SDK 방식은 실제 PG를 붙이는 태스크에서 이 분기에 더한다.
function performNextAction(action: NextAction): void {
  if (action.kind === "redirect") {
    window.location.assign(action.url);
    return;
  }
  // 손님에게는 「알 수 없는 오류」로 보이지만 이건 우리 쪽 구현 누락이다.
  // 로그에 남겨 두지 않으면 PG를 붙인 뒤 이 상태를 눈치채지 못한다.
  console.error(`payment: unsupported nextAction "${action.kind}"`);
  throw new Error(`unsupported nextAction: ${action.kind}`);
}
