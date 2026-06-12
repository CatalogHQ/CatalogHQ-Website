import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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
import OtpCodeField from "@/components/auth/OtpCodeField";
import PasswordInput from "@/components/auth/PasswordInput";
import { useAuth } from "@/contexts/AuthContext";
import {
  forgotPasswordRequestSchema,
  resetPasswordCodeSchema,
  type ForgotPasswordRequestValues,
  type ResetPasswordCodeFormValues,
} from "@/lib/auth-schemas";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { forgotPassword, resetPassword } = useAuth();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [email, setEmail] = useState("");

  const requestForm = useForm<ForgotPasswordRequestValues>({
    resolver: zodResolver(forgotPasswordRequestSchema),
    defaultValues: { email: "" },
  });

  const resetForm = useForm<ResetPasswordCodeFormValues>({
    resolver: zodResolver(resetPasswordCodeSchema),
    defaultValues: {
      code: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onRequestOtp = async (values: ForgotPasswordRequestValues) => {
    setLoading(true);
    try {
      const normalized = values.email.trim().toLowerCase();
      await forgotPassword(normalized);
      setEmail(normalized);
      resetForm.reset({
        code: "",
        newPassword: "",
        confirmPassword: "",
      });
      setStep("reset");
      toast.success(
        "If an account exists for this email, we sent a reset code.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not send reset code.",
      );
    } finally {
      setLoading(false);
    }
  };

  const onResendCode = async () => {
    if (!email) return;

    setResending(true);
    try {
      await forgotPassword(email);
      toast.success("If an account exists for this email, we sent a new code.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not resend reset code.",
      );
    } finally {
      setResending(false);
    }
  };

  const onResetPassword = async (values: ResetPasswordCodeFormValues) => {
    if (!email) {
      toast.error("Reset session expired. Request a new code.");
      setStep("request");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email, values.code, values.newPassword);
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
          ? "Enter your vendor email. We will send a 6-digit code if an account exists."
          : `Enter the code sent to ${email || "your email"}.`
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
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
            <OtpCodeField control={resetForm.control} name="code" autoFocus />

            <FormField
              control={resetForm.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      autoComplete="new-password"
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
                      autoComplete="new-password"
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
              variant="outline"
              disabled={resending}
              className="h-11 w-full"
              onClick={onResendCode}
            >
              {resending ? "Sending..." : "Resend reset code"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setStep("request")}
            >
              Use a different email
            </Button>
          </form>
        </Form>
      )}
    </AuthLayout>
  );
}
