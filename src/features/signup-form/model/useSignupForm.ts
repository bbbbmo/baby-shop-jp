"use client";

import { useState } from "react";
import {
  initialSignupFormValues,
  validateSignupForm,
  type SignupFormErrors,
  type SignupFormField,
  type SignupFormValues,
} from "./schema";
import { signUpWithEmail } from "@/shared/api/supabase";

export type SignupStatus = "idle" | "submitting" | "success" | "error";

type SignupFormState = {
  values: SignupFormValues;
  errors: SignupFormErrors;
  status: SignupStatus;
  submitError: string | null;
};

const initialState: SignupFormState = {
  values: initialSignupFormValues,
  errors: {},
  status: "idle",
  submitError: null,
};

export function useSignupForm() {
  const [state, setState] = useState<SignupFormState>(initialState);

  const setField = (field: SignupFormField, value: string | boolean) => {
    setState((prev) => ({
      ...prev,
      values: { ...prev.values, [field]: value },
    }));
  };

  const submit = async () => {
    const errors = validateSignupForm(state.values);
    if (Object.keys(errors).length > 0) {
      setState((prev) => ({ ...prev, errors }));
      return;
    }
    await submitSignup(state.values, setState);
  };

  return { ...state, setField, submit };
}

async function submitSignup(
  values: SignupFormValues,
  setState: React.Dispatch<React.SetStateAction<SignupFormState>>,
): Promise<void> {
  setState((prev) => ({
    ...prev,
    status: "submitting",
    submitError: null,
    errors: {},
  }));
  const { error } = await signUpWithEmail({
    email: values.email,
    password: values.password,
    name: values.name,
    furigana: values.furigana,
    marketingOptIn: values.agreeMarketing,
  });
  if (error) {
    setState((prev) => ({ ...prev, status: "error", submitError: error }));
    return;
  }
  setState((prev) => ({ ...prev, status: "success" }));
}
