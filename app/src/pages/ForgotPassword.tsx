import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Mail } from "lucide-react";
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
import {
  AuthGhostButton,
  AuthMinimalInput,
  AuthMinimalPasswordInput,
  AuthPrimaryButton,
  AuthSecondaryButton,
} from "@/components/auth/auth-minimal";
import { authMinimalMessageClass } from "@/components/auth/auth-minimal-styles";
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
      title={step === "request" ? "Forgot password" : "Reset password"}
      subtitle={
        step === "request"
          ? "We will send a 6-digit code if an account exists."
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
            className="space-y-6"
          >
            <FormField
              control={requestForm.control}
              name="email"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="sr-only">Email</FormLabel>
                  <FormControl>
                    <AuthMinimalInput
                      icon={Mail}
                      type="email"
                      autoComplete="email"
                      placeholder="Email"
                      invalid={!!fieldState.error}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage
                    className={authMinimalMessageClass(!!fieldState.error)}
                  />
                </FormItem>
              )}
            />

            <AuthPrimaryButton type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send reset code"}
            </AuthPrimaryButton>
          </form>
        </Form>
      ) : (
        <Form {...resetForm}>
          <form
            onSubmit={resetForm.handleSubmit(onResetPassword)}
            className="space-y-6"
          >
            <OtpCodeField control={resetForm.control} name="code" autoFocus />

            <FormField
              control={resetForm.control}
              name="newPassword"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="sr-only">New password</FormLabel>
                  <FormControl>
                    <AuthMinimalPasswordInput
                      autoComplete="new-password"
                      placeholder="New password"
                      invalid={!!fieldState.error}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage
                    className={authMinimalMessageClass(!!fieldState.error)}
                  />
                </FormItem>
              )}
            />

            <FormField
              control={resetForm.control}
              name="confirmPassword"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="sr-only">Confirm password</FormLabel>
                  <FormControl>
                    <AuthMinimalPasswordInput
                      autoComplete="new-password"
                      placeholder="Confirm password"
                      invalid={!!fieldState.error}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage
                    className={authMinimalMessageClass(!!fieldState.error)}
                  />
                </FormItem>
              )}
            />

            <AuthPrimaryButton type="submit" disabled={loading}>
              {loading ? "Updating..." : "Reset password"}
            </AuthPrimaryButton>

            <AuthSecondaryButton
              type="button"
              disabled={resending}
              onClick={onResendCode}
            >
              {resending ? "Sending..." : "Resend code"}
            </AuthSecondaryButton>

            <AuthGhostButton type="button" onClick={() => setStep("request")}>
              Use a different email
            </AuthGhostButton>
          </form>
        </Form>
      )}
    </AuthLayout>
  );
}
