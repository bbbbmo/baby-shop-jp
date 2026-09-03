"use client";

import { useState } from "react";
import type { NextAction } from "@/shared/api/payments/types";

type StartResponse = { paymentId: string; nextAction: NextAction } | { error: string };

export function useStartPayment() {
  const [payError, setPayError] = useState<string | null>(null);

  const start = async (orderNumber: string, email: string, methodId: string): Promise<void> => {
    setPayError(null);
    try {
      const result = await requestStart(orderNumber, email, methodId);
      if ("error" in result) {
        setPayError(result.error);
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

// 결제창을 여는 방법은 PG마다 다르다. 지금은 리다이렉트 하나뿐이고,
// SDK 방식은 실제 PG를 붙이는 태스크에서 이 분기에 더한다.
function performNextAction(action: NextAction): void {
  if (action.kind === "redirect") {
    window.location.assign(action.url);
    return;
  }
  throw new Error(`unsupported nextAction: ${action.kind}`);
}
