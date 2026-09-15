"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resendSignupEmail } from "@/shared/api/supabase";
import { useMarket } from "@/shared/market";
import {
  resendConfirmationSchema,
  initialResendConfirmationValues,
  type ResendConfirmationValues,
} from "./schema";

export function useResendConfirmationForm(onSent: () => void) {
  const market = useMarket();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResendConfirmationValues>({
    resolver: zodResolver(resendConfirmationSchema),
    defaultValues: initialResendConfirmationValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const { error } = await resendSignupEmail(values.email, market);
    if (error) {
      setSubmitError(error);
      return;
    }
    onSent();
  });

  return { register, errors, isSubmitting, submitError, onSubmit };
}
