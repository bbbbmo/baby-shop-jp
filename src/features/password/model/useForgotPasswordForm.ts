"use client";

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
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: initialForgotPasswordFormValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    // 마켓을 붙여야 /jp에서 요청한 사람이 일본어 화면으로 돌아온다.
    const redirectTo = `${window.location.origin}${marketPath(market, "/auth/reset-password")}`;
    // 결과를 보지 않는다. Supabase는 가입되지 않은 주소에는 발송을 시도조차
    // 하지 않아 에러가 안 나고, 가입된 주소에서만 발송 실패(잘못된 도메인,
    // 발송 한도 초과)가 난다. 즉 "에러가 났다" 자체가 "이 주소는 가입돼 있다"는
    // 신호라, 화면에 드러내면 아무나 주소를 넣어보며 회원 목록을 모을 수 있다.
    await requestPasswordReset(values.email, redirectTo);
    onSent();
  });

  return { register, errors, isSubmitting, onSubmit };
}
