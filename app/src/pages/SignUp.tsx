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
  signUpSchema,
  verifySignUpCodeSchema,
  type SignUpFormValues,
  type VerifySignUpCodeFormValues,
} from "@/lib/auth-schemas";

export default function SignUp() {
  const navigate = useNavigate();
  const { initSignUp, verifySignUp, resendSignUpOtp } = useAuth();
  const [step, setStep] = useState<"details" | "verify">("details");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingPassword, setPendingPassword] = useState("");

  const detailsForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const verifyForm = useForm<VerifySignUpCodeFormValues>({
    resolver: zodResolver(verifySignUpCodeSchema),
    defaultValues: {
      code: "",
    },
  });

  const onSubmitDetails = async (data: SignUpFormValues) => {
    setLoading(true);
    try {
      const email = data.email.trim().toLowerCase();
      await initSignUp(email, data.password);
      setPendingEmail(email);
      setPendingPassword(data.password);
      verifyForm.reset({ code: "" });
      setStep("verify");
      toast.success("We sent a verification code to your email.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not start sign up.",
      );
    } finally {
      setLoading(false);
    }
  };

  const onResendCode = async () => {
    if (!pendingEmail || !pendingPassword) return;

    setResending(true);
    try {
      await resendSignUpOtp(pendingEmail, pendingPassword);
      toast.success("We sent a new verification code to your email.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not resend code.",
      );
    } finally {
      setResending(false);
    }
  };

  const onSubmitVerify = async (data: VerifySignUpCodeFormValues) => {
    if (!pendingEmail) {
      toast.error("Sign-up session expired. Please start again.");
      setStep("details");
      return;
    }

    setLoading(true);
    try {
      await verifySignUp(pendingEmail, data.code);
      toast.success("Account verified! Let's set up your store.");
      navigate("/dashboard/setup");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not verify your code.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={step === "details" ? "Vendor sign up" : "Verify email"}
      subtitle={
        step === "verify"
          ? `Enter the code sent to ${pendingEmail || "your email"}.`
          : undefined
      }
      footerText="Already have an account?"
      footerLinkText="Sign in"
      footerLinkTo="/sign-in"
    >
      {step === "details" ? (
        <Form {...detailsForm}>
          <form
            onSubmit={detailsForm.handleSubmit(onSubmitDetails)}
            className="space-y-6"
          >
            <FormField
              control={detailsForm.control}
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

            <FormField
              control={detailsForm.control}
              name="password"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="sr-only">Password</FormLabel>
                  <FormControl>
                    <AuthMinimalPasswordInput
                      autoComplete="new-password"
                      placeholder="Password"
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
              control={detailsForm.control}
              name="confirmPassword"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="sr-only">Confirm password</FormLabel>
                  <FormControl>
                    <AuthMinimalPasswordInput
                      autoComplete="off"
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
              {loading ? "Sending code..." : "Continue"}
            </AuthPrimaryButton>
          </form>
        </Form>
      ) : (
        <Form {...verifyForm}>
          <form
            onSubmit={verifyForm.handleSubmit(onSubmitVerify)}
            className="space-y-6"
          >
            <OtpCodeField
              control={verifyForm.control}
              name="code"
              autoFocus
            />

            <AuthPrimaryButton type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Create account"}
            </AuthPrimaryButton>

            <AuthSecondaryButton
              type="button"
              disabled={resending}
              onClick={onResendCode}
            >
              {resending ? "Sending..." : "Resend code"}
            </AuthSecondaryButton>

            <AuthGhostButton type="button" onClick={() => setStep("details")}>
              Use a different email
            </AuthGhostButton>
          </form>
        </Form>
      )}
    </AuthLayout>
  );
}
