"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, initialSignupFormValues, type SignupFormValues } from "./schema";
import { signUpWithEmail } from "@/shared/api/supabase";

export function useSignupForm(onSuccess: () => void) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: initialSignupFormValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const { error } = await signUpWithEmail({
      email: values.email,
      password: values.password,
      name: values.name,
      furigana: values.furigana,
      phone: values.phone,
      marketingOptIn: values.agreeMarketing,
    });
    if (error) {
      setSubmitError(error);
      return;
    }
    onSuccess();
  });

  return { register, errors, isSubmitting, submitError, onSubmit };
}
