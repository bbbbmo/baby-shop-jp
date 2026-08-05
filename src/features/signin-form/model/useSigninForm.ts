"use client";

import { useState } from "react";
import {
  initialSigninFormValues,
  validateSigninForm,
  type SigninFormErrors,
  type SigninFormField,
  type SigninFormValues,
} from "./schema";
import { signInWithEmail } from "@/shared/api/supabase";

export type SigninStatus = "idle" | "submitting" | "success" | "error";

type SigninFormState = {
  values: SigninFormValues;
  errors: SigninFormErrors;
  status: SigninStatus;
  submitError: string | null;
};

const initialState: SigninFormState = {
  values: initialSigninFormValues,
  errors: {},
  status: "idle",
  submitError: null,
};

export function useSigninForm() {
  const [state, setState] = useState<SigninFormState>(initialState);

  const setField = (field: SigninFormField, value: string) => {
    setState((prev) => ({
      ...prev,
      values: { ...prev.values, [field]: value },
    }));
  };

  const submit = async () => {
    const errors = validateSigninForm(state.values);
    if (Object.keys(errors).length > 0) {
      setState((prev) => ({ ...prev, errors }));
      return;
    }
    await submitSignin(state.values, setState);
  };

  return { ...state, setField, submit };
}

async function submitSignin(
  values: SigninFormValues,
  setState: React.Dispatch<React.SetStateAction<SigninFormState>>,
): Promise<void> {
  setState((prev) => ({
    ...prev,
    status: "submitting",
    submitError: null,
    errors: {},
  }));
  const { error } = await signInWithEmail(values.email, values.password);
  if (error) {
    setState((prev) => ({ ...prev, status: "error", submitError: error }));
    return;
  }
  setState((prev) => ({ ...prev, status: "success" }));
}
