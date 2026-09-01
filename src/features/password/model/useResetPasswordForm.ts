"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPassword } from "@/shared/api/supabase";
import {
  initialResetPasswordFormValues,
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "./schema";

export function useResetPasswordForm(onSuccess: () => void) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: initialResetPasswordFormValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const { error } = await resetPassword(values.password);
    if (error) {
      setSubmitError(error);
      return;
    }
    onSuccess();
  });

  return { register, errors, isSubmitting, submitError, onSubmit };
}
