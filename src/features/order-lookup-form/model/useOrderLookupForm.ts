"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { orderLookupSchema, initialOrderLookupFormValues, type OrderLookupFormValues } from "./schema";
import { lookupOrder } from "@/shared/api/supabase";
import type { Order } from "@/entities/order";

export function useOrderLookupForm() {
  const [result, setResult] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OrderLookupFormValues>({
    resolver: zodResolver(orderLookupSchema),
    defaultValues: initialOrderLookupFormValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    setNotFound(false);
    const order = await lookupOrder(values.orderNumber, values.email);
    if (!order) {
      setNotFound(true);
      setResult(null);
      return;
    }
    setResult(order);
  });

  return { register, errors, isSubmitting, notFound, result, onSubmit };
}
