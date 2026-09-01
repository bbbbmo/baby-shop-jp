"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePassword } from "@/shared/api/supabase";
import {
  changePasswordSchema,
  initialChangePasswordFormValues,
  type ChangePasswordFormValues,
} from "./schema";

export function useChangePasswordForm(onSuccess: () => void) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: initialChangePasswordFormValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const { error } = await changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.password,
    });
    if (error) {
      setSubmitError(error);
      return;
    }
    // 비밀번호가 폼 상태에 남지 않게 지운다.
    reset(initialChangePasswordFormValues);
    onSuccess();
  });

  return { register, errors, isSubmitting, submitError, onSubmit, reset };
}
