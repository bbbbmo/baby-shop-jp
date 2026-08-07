"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signinSchema, initialSigninFormValues, type SigninFormValues } from "./schema";
import { signInWithEmail } from "@/shared/api/supabase";

export function useSigninForm(onSuccess: () => void) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SigninFormValues>({
    resolver: zodResolver(signinSchema),
    defaultValues: initialSigninFormValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const { error } = await signInWithEmail(values.email, values.password);
    if (error) {
      setSubmitError(error);
      return;
    }
    onSuccess();
  });

  return { register, errors, isSubmitting, submitError, onSubmit };
}
