import { z } from "zod";

function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

function isValidNigerianPhone(phone: string): boolean {
  const digits = normalizePhoneDigits(phone);

  if (digits.startsWith("234")) {
    return digits.length >= 12 && digits.length <= 13;
  }

  if (digits.startsWith("0")) {
    return digits.length === 11;
  }

  return digits.length >= 10 && digits.length <= 13;
}

export const phoneSchema = z
  .string()
  .min(1, "WhatsApp phone number is required")
  .refine(isValidNigerianPhone, {
    message: "Enter a valid Nigerian WhatsApp number (e.g. 08012345678)",
  });

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters");

export const signUpSchema = z
  .object({
    phone: phoneSchema,
    email: z
      .string()
      .email("Enter a valid email")
      .optional()
      .or(z.literal("")),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const signInSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "Password is required"),
});

export type SignUpFormValues = z.infer<typeof signUpSchema>;
export type SignInFormValues = z.infer<typeof signInSchema>;
