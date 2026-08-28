"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { consentSchema, initialConsentFormValues, type ConsentFormValues } from "./schema";
import { saveConsents } from "@/shared/api/supabase";

export function useConsentForm(userId: string, onSuccess: () => void) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ConsentFormValues>({
    resolver: zodResolver(consentSchema),
    defaultValues: initialConsentFormValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const { error } = await saveConsents(userId, toConsentInput(values));
    if (error) {
      setSubmitError("unknownError");
      return;
    }
    onSuccess();
  });

  return { register, errors, isSubmitting, submitError, onSubmit };
}

function toConsentInput(values: ConsentFormValues) {
  return {
    terms: values.agreeTerms,
    privacy: values.agreePrivacy,
    marketing: values.agreeMarketing,
  };
}
