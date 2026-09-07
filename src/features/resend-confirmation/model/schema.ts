import { z } from "zod";

// 오류 코드는 가입 폼과 같은 이름을 써서 사전 문구를 재활용한다.
export const resendConfirmationSchema = z.object({
  email: z.string().min(1, "required").email("invalidEmail"),
});

export type ResendConfirmationValues = z.infer<typeof resendConfirmationSchema>;

export const initialResendConfirmationValues: ResendConfirmationValues = { email: "" };
