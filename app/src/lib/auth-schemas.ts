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
  .min(1, "Phone number is required")
  .refine(isValidNigerianPhone, {
    message: "Enter a valid Nigerian phone number (e.g. 08012345678)",
  });

export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Enter a valid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters");

export const signUpSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const verifySignUpSchema = z.object({
  email: emailSchema,
  code: z.string().length(6, "Enter the 6-digit code"),
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordRequestSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    email: emailSchema,
    code: z.string().length(6, "Enter the 6-digit code"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignUpFormValues = z.infer<typeof signUpSchema>;
export type VerifySignUpFormValues = z.infer<typeof verifySignUpSchema>;
export type SignInFormValues = z.infer<typeof signInSchema>;
export type ForgotPasswordRequestValues = z.infer<
  typeof forgotPasswordRequestSchema
>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
