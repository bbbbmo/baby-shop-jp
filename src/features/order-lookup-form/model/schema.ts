import { z } from "zod";

export const orderLookupSchema = z.object({
  orderNumber: z.string().min(1, "required"),
  email: z.string().min(1, "required").email("invalidEmail"),
});

export type OrderLookupFormValues = z.infer<typeof orderLookupSchema>;

export const initialOrderLookupFormValues: OrderLookupFormValues = {
  orderNumber: "",
  email: "",
};
