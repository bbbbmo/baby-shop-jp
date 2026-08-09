"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkoutSchema, initialCheckoutFormValues, type CheckoutFormValues } from "./schema";
import type { CartItem } from "@/entities/cart";

type SubmitError = { code: string; productName?: string };
type CheckoutItem = { productId: string; color: string; size: string; quantity: number };
type CheckoutErrorResponse = { error: string; productName?: string };
type CheckoutSuccessResponse = { orderNumber: string };

export function useCheckoutForm(
  items: CartItem[],
  userId: string | null,
  prefill: Partial<CheckoutFormValues>,
  onSuccess: (orderNumber: string) => void,
) {
  const [submitError, setSubmitError] = useState<SubmitError | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { ...initialCheckoutFormValues, ...prefill },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const result = await submitCheckout(items, userId, values);
    if ("error" in result) {
      setSubmitError({ code: result.error, productName: result.productName });
      return;
    }
    onSuccess(result.orderNumber);
  });

  return { register, errors, isSubmitting, submitError, onSubmit };
}

async function submitCheckout(
  items: CartItem[],
  userId: string | null,
  shipping: CheckoutFormValues,
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
    body: JSON.stringify({ items: checkoutItems, shipping, userId }),
  });
  if (!res.ok) {
    return (await res.json()) as CheckoutErrorResponse;
  }
  return (await res.json()) as CheckoutSuccessResponse;
}
