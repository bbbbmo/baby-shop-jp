"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { requestPasswordReset } from "@/shared/api/supabase";
import { marketPath, useMarket } from "@/shared/market";
import {
  forgotPasswordSchema,
  initialForgotPasswordFormValues,
  type ForgotPasswordFormValues,
} from "./schema";

export function useForgotPasswordForm(onSent: () => void) {
  const market = useMarket();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: initialForgotPasswordFormValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    // 마켓을 붙여야 /jp에서 요청한 사람이 일본어 화면으로 돌아온다.
    const redirectTo = `${window.location.origin}${marketPath(market, "/auth/reset-password")}`;
    const { error } = await requestPasswordReset(values.email, redirectTo);
    if (error) {
      setSubmitError(error);
      return;
    }
    onSent();
  });

  return { register, errors, isSubmitting, submitError, onSubmit };
}
