import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import AuthLayout from "@/components/auth/AuthLayout";
import PasswordInput from "@/components/auth/PasswordInput";
import { authRepository } from "@/lib/repositories";
import { passwordSchema, phoneSchema } from "@/lib/auth-schemas";

const requestSchema = z.object({
  phone: phoneSchema,
});

const resetSchema = z
  .object({
    phone: phoneSchema,
    code: z.string().min(6, "Enter the 6-digit code").max(6),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RequestValues = z.infer<typeof requestSchema>;
type ResetValues = z.infer<typeof resetSchema>;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");

  const requestForm = useForm<RequestValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: { phone: "" },
  });

  const resetForm = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      phone: "",
      code: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onRequestOtp = async (values: RequestValues) => {
    setLoading(true);
    try {
      await authRepository.forgotPassword(values.phone);
      setPhone(values.phone);
      resetForm.setValue("phone", values.phone);
      setStep("reset");
      toast.success("We sent a reset code to your phone.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not send reset code.",
      );
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async (values: ResetValues) => {
    setLoading(true);
    try {
      await authRepository.resetPassword(
        values.phone,
        values.code,
        values.newPassword,
      );
      toast.success("Password updated. You can sign in now.");
      navigate("/sign-in");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not reset password.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={step === "request" ? "Forgot password" : "Enter reset code"}
      subtitle={
        step === "request"
          ? "We'll send a 6-digit code to your phone number."
          : `Enter the code sent to ${phone || "your phone"}.`
      }
      footerText="Remember your password?"
      footerLinkText="Sign in"
      footerLinkTo="/sign-in"
    >
      {step === "request" ? (
        <Form {...requestForm}>
          <form
            onSubmit={requestForm.handleSubmit(onRequestOtp)}
            className="space-y-4"
          >
            <FormField
              control={requestForm.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone number</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="08012345678"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-xl bg-whatsapp-green text-base font-semibold hover:bg-whatsapp-green/90"
            >
              {loading ? "Sending..." : "Send reset code"}
            </Button>
          </form>
        </Form>
      ) : (
        <Form {...resetForm}>
          <form
            onSubmit={resetForm.handleSubmit(onResetPassword)}
            className="space-y-4"
          >
            <FormField
              control={resetForm.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>6-digit code</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      placeholder="123456"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={resetForm.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="At least 8 characters"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={resetForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm new password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="Re-enter your password"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-xl bg-whatsapp-green text-base font-semibold hover:bg-whatsapp-green/90"
            >
              {loading ? "Updating..." : "Reset password"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setStep("request")}
            >
              Use a different number
            </Button>
          </form>
        </Form>
      )}

      <p className="mt-4 text-center text-sm text-gray-500">
        <Link to="/sign-in" className="text-whatsapp-dark hover:text-whatsapp-green">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
