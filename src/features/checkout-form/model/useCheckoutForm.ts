"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkoutSchema, initialCheckoutFormValues, type CheckoutFormValues } from "./schema";
import type { CartItem } from "@/entities/cart";
import { useMarket } from "@/shared/market";
import type { Market } from "@/shared/config/markets";

type SubmitError = { code: string; productName?: string };
type CheckoutItem = { productId: string; color: string; size: string; quantity: number };
type CheckoutErrorResponse = { error: string; productName?: string };
type CheckoutSuccessResponse = { orderNumber: string };

export function useCheckoutForm(
  items: CartItem[],
  prefill: Partial<CheckoutFormValues>,
  onSuccess: (orderNumber: string) => void,
) {
  const [submitError, setSubmitError] = useState<SubmitError | null>(null);
  const market = useMarket();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema(market)),
    defaultValues: { ...initialCheckoutFormValues, ...prefill },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      const result = await submitCheckout(items, values, market);
      if ("error" in result) {
        setSubmitError({ code: result.error, productName: result.productName });
        return;
      }
      onSuccess(result.orderNumber);
    } catch {
      setSubmitError({ code: "unknownError" });
    }
  });

  return { register, setValue, errors, isSubmitting, submitError, onSubmit };
}

async function submitCheckout(
  items: CartItem[],
  shipping: CheckoutFormValues,
  market: Market,
): Promise<CheckoutSuccessResponse | CheckoutErrorResponse> {
  const checkoutItems: CheckoutItem[] = items.map((i) => ({
    productId: i.productId,
    color: i.color,
    size: i.size,
    quantity: i.quantity,
  }));
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: checkoutItems, shipping, market }),
  });
  if (!res.ok) {
    return (await res.json()) as CheckoutErrorResponse;
  }
  return (await res.json()) as CheckoutSuccessResponse;
}
