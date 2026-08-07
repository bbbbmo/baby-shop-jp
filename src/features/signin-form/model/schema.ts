import { z } from "zod";

export const signinSchema = z.object({
  email: z.string().min(1, "required").email("invalidEmail"),
  password: z.string().min(1, "required"),
});

export type SigninFormValues = z.infer<typeof signinSchema>;

export const initialSigninFormValues: SigninFormValues = {
  email: "",
  password: "",
};
