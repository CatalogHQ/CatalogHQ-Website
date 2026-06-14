import { z } from "zod";

export const payoutSetupSchema = z.object({
  bankCode: z.string().min(1, "Select a bank."),
  accountNumber: z
    .string()
    .regex(/^\d{10}$/, "Account number must be 10 digits."),
});

export type PayoutSetupFormValues = z.infer<typeof payoutSetupSchema>;
